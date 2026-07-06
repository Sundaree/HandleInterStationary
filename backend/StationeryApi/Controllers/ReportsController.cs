using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StationeryApi.Data;
using StationeryApi.Models;

namespace StationeryApi.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReportsController(AppDbContext db) => _db = db;

    private int CurrentUserId()
    {
        var v = Request.Headers["X-User-Id"].FirstOrDefault();
        return int.TryParse(v, out var id) ? id : 0;
    }

    private async Task<User?> CurrentUser()
        => await _db.Users.FirstOrDefaultAsync(u => u.Id == CurrentUserId());

    // Apply role-based scope: CEO -> own company, Manager -> own department, HR/Admin -> all
    private IQueryable<Request> ScopeByRole(IQueryable<Request> q, User me)
    {
        return me.Role switch
        {
            UserRole.Executive        => q.Where(r => r.CompanyId == me.CompanyId),
            UserRole.DepartmentManager => q.Where(r => r.DepartmentId == (me.DepartmentId ?? 0)),
            UserRole.HR or UserRole.Admin => q,
            _ => q.Where(r => r.RequesterUserId == me.Id), // Employees see only their own
        };
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var me = await CurrentUser();
        if (me == null) return Unauthorized();

        var start = DateTime.SpecifyKind(from ?? DateTime.UtcNow.AddMonths(-1), DateTimeKind.Utc);
        var end   = DateTime.SpecifyKind(to   ?? DateTime.UtcNow.AddDays(1),    DateTimeKind.Utc);

        var baseQ = _db.Requests
            .Where(r => r.CreatedAt >= start && r.CreatedAt <= end
                   && r.Status != RequestStatus.Rejected && r.Status != RequestStatus.Cancelled);
        var q = ScopeByRole(baseQ, me);

        var totalAmount = await q.SumAsync(r => (decimal?)r.TotalAmount) ?? 0m;
        var totalRequests = await q.CountAsync();

        // Low-stock is a global signal (only relevant for HR/Admin/Executive)
        var lowStock = (me.Role == UserRole.HR || me.Role == UserRole.Admin || me.Role == UserRole.Executive)
            ? await _db.Items.CountAsync(i => i.StockQty <= i.ReorderLevel && i.IsActive)
            : 0;

        var byCompany = await q.Include(r => r.Company)
            .GroupBy(r => new { r.CompanyId, r.Company!.Name })
            .Select(g => new { CompanyId = g.Key.CompanyId, Company = g.Key.Name, Amount = g.Sum(x => x.TotalAmount), Requests = g.Count() })
            .OrderByDescending(x => x.Amount).ToListAsync();

        var byDept = await q.Include(r => r.Department).Include(r => r.Company)
            .GroupBy(r => new { r.DepartmentId, DeptName = r.Department!.Name, CompanyName = r.Company!.Name })
            .Select(g => new { Department = g.Key.DeptName, Company = g.Key.CompanyName, Amount = g.Sum(x => x.TotalAmount), Requests = g.Count() })
            .OrderByDescending(x => x.Amount).ToListAsync();

        var topItems = await _db.RequestItems
            .Where(ri => ri.Request!.CreatedAt >= start && ri.Request!.CreatedAt <= end)
            .Where(ri => me.Role == UserRole.HR || me.Role == UserRole.Admin
                      || (me.Role == UserRole.Executive && ri.Request!.CompanyId == me.CompanyId)
                      || (me.Role == UserRole.DepartmentManager && ri.Request!.DepartmentId == (me.DepartmentId ?? 0)))
            .Include(ri => ri.Item)
            .GroupBy(ri => new { ri.ItemId, ri.Item!.Name })
            .Select(g => new { Item = g.Key.Name, Qty = g.Sum(x => x.Qty), Amount = g.Sum(x => x.Qty * x.UnitPrice) })
            .OrderByDescending(x => x.Amount).Take(10).ToListAsync();

        return Ok(new {
            totalAmount, totalRequests, lowStock, byCompany, byDept, topItems,
            from = start, to = end,
            scope = me.Role.ToString(),
            scopeName = me.Role == UserRole.Executive ? (await _db.Companies.Where(c => c.Id == me.CompanyId).Select(c => c.Name).FirstOrDefaultAsync())
                     : me.Role == UserRole.DepartmentManager ? (await _db.Departments.Where(d => d.Id == me.DepartmentId).Select(d => d.Name).FirstOrDefaultAsync())
                     : null
        });
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var me = await CurrentUser();
        if (me == null) return Unauthorized();

        // Base counts (HR/Admin see globals; others see nothing meaningful)
        int pending = 0, ready = 0, preparing = 0, lowStock = 0;
        if (me.Role == UserRole.HR || me.Role == UserRole.Admin)
        {
            pending    = await _db.Requests.CountAsync(r => r.Status == RequestStatus.PendingApproval);
            ready      = await _db.Requests.CountAsync(r => r.Status == RequestStatus.ReadyForPickup);
            preparing  = await _db.Requests.CountAsync(r => r.Status == RequestStatus.Approved || r.Status == RequestStatus.Preparing);
            lowStock   = await _db.Items.CountAsync(i => i.StockQty <= i.ReorderLevel && i.IsActive);
        }
        else if (me.Role == UserRole.DepartmentManager)
        {
            var deptIds = await _db.Departments.Where(d => d.ManagerUserId == me.Id).Select(d => d.Id).ToListAsync();
            pending = await _db.Requests.CountAsync(r => r.Status == RequestStatus.PendingApproval && deptIds.Contains(r.DepartmentId));
        }

        // Monthly amount, scoped by role
        var monthQ = _db.Requests.Where(r => r.CreatedAt >= DateTime.UtcNow.AddDays(-30) && r.Status != RequestStatus.Rejected);
        monthQ = ScopeByRole(monthQ, me);
        var monthAmount = await monthQ.SumAsync(r => (decimal?)r.TotalAmount) ?? 0m;

        return Ok(new {
            pending, ready, preparing, lowStock, monthAmount,
            role = me.Role.ToString(),
            showAmount = me.Role == UserRole.Executive || me.Role == UserRole.DepartmentManager,
        });
    }

    // Annual spending report for CEO — monthly breakdown of their own company
    [HttpGet("annual")]
    public async Task<IActionResult> Annual([FromQuery] int? year)
    {
        var me = await CurrentUser();
        if (me == null) return Unauthorized();
        if (me.Role != UserRole.Executive && me.Role != UserRole.Admin && me.Role != UserRole.HR)
            return StatusCode(403, new { message = "เฉพาะผู้บริหาร/แอดมิน/HR เท่านั้น" });

        var y = year ?? DateTime.UtcNow.Year;
        var start = new DateTime(y, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddYears(1);

        // Executive scoped to own company; Admin/HR see all
        var q = _db.Requests.Where(r => r.CreatedAt >= start && r.CreatedAt < end
                                     && r.Status != RequestStatus.Rejected && r.Status != RequestStatus.Cancelled);
        if (me.Role == UserRole.Executive) q = q.Where(r => r.CompanyId == me.CompanyId);

        var raw = await q
            .Select(r => new { r.CreatedAt, r.TotalAmount, r.DepartmentId })
            .ToListAsync();

        var byMonth = Enumerable.Range(1, 12).Select(m => new {
            month = m,
            amount = raw.Where(r => r.CreatedAt.Month == m).Sum(r => r.TotalAmount),
            requests = raw.Count(r => r.CreatedAt.Month == m),
        }).ToList();

        var deptIds = raw.Select(r => r.DepartmentId).Distinct().ToList();
        var depts = await _db.Departments.Where(d => deptIds.Contains(d.Id)).ToListAsync();
        var byDept = raw
            .GroupBy(r => r.DepartmentId)
            .Select(g => new {
                department = depts.FirstOrDefault(d => d.Id == g.Key)?.Name ?? "-",
                amount = g.Sum(x => x.TotalAmount),
                requests = g.Count(),
            })
            .OrderByDescending(x => x.amount)
            .ToList();

        var companyName = me.Role == UserRole.Executive
            ? await _db.Companies.Where(c => c.Id == me.CompanyId).Select(c => c.Name).FirstOrDefaultAsync()
            : "ทุกบริษัท";

        return Ok(new {
            year = y,
            company = companyName,
            totalAmount = raw.Sum(r => r.TotalAmount),
            totalRequests = raw.Count,
            byMonth,
            byDept,
        });
    }
}
