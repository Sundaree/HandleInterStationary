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

    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var start = from ?? DateTime.UtcNow.AddMonths(-1);
        var end = to ?? DateTime.UtcNow.AddDays(1);
        var q = _db.Requests
            .Where(r => r.CreatedAt >= start && r.CreatedAt <= end
                   && r.Status != RequestStatus.Rejected && r.Status != RequestStatus.Cancelled);

        var totalAmount = await q.SumAsync(r => (decimal?)r.TotalAmount) ?? 0m;
        var totalRequests = await q.CountAsync();
        var lowStock = await _db.Items.CountAsync(i => i.StockQty <= i.ReorderLevel && i.IsActive);

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
            .Include(ri => ri.Item)
            .GroupBy(ri => new { ri.ItemId, ri.Item!.Name })
            .Select(g => new { Item = g.Key.Name, Qty = g.Sum(x => x.Qty), Amount = g.Sum(x => x.Qty * x.UnitPrice) })
            .OrderByDescending(x => x.Amount).Take(10).ToListAsync();

        return Ok(new { totalAmount, totalRequests, lowStock, byCompany, byDept, topItems, from = start, to = end });
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var pending = await _db.Requests.CountAsync(r => r.Status == RequestStatus.PendingApproval);
        var ready = await _db.Requests.CountAsync(r => r.Status == RequestStatus.ReadyForPickup);
        var preparing = await _db.Requests.CountAsync(r => r.Status == RequestStatus.Approved || r.Status == RequestStatus.Preparing);
        var lowStock = await _db.Items.CountAsync(i => i.StockQty <= i.ReorderLevel && i.IsActive);
        var monthAmount = await _db.Requests
            .Where(r => r.CreatedAt >= DateTime.UtcNow.AddDays(-30) && r.Status != RequestStatus.Rejected)
            .SumAsync(r => (decimal?)r.TotalAmount) ?? 0m;
        return Ok(new { pending, ready, preparing, lowStock, monthAmount });
    }
}
