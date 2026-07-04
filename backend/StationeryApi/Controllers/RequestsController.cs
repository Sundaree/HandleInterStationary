using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StationeryApi.Data;
using StationeryApi.Dtos;
using StationeryApi.Models;

namespace StationeryApi.Controllers;

[ApiController]
[Route("api/requests")]
public class RequestsController : ControllerBase
{
    private readonly AppDbContext _db;
    public RequestsController(AppDbContext db) => _db = db;

    private int CurrentUserId()
    {
        var v = Request.Headers["X-User-Id"].FirstOrDefault();
        return int.TryParse(v, out var id) ? id : 0;
    }

    [HttpGet("mine")]
    public async Task<IActionResult> Mine()
    {
        var uid = CurrentUserId();
        var list = await _db.Requests
            .Where(r => r.RequesterUserId == uid)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new {
                r.Id, r.RequestNo, Status = r.Status.ToString(), r.CreatedAt,
                r.TotalAmount, r.PickupDate, r.PickupTime, r.PickupLocation,
                ItemsCount = r.Items.Count
            }).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Detail(int id)
    {
        var r = await _db.Requests
            .Include(x => x.Requester).Include(x => x.Department).Include(x => x.Company)
            .Include(x => x.Approver)
            .Include(x => x.Items).ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (r == null) return NotFound();
        return Ok(new {
            r.Id, r.RequestNo, Status = r.Status.ToString(),
            r.CreatedAt, r.ApprovedAt, r.RejectReason,
            r.PickupDate, r.PickupTime, r.PickupLocation, r.Note, r.TotalAmount,
            Requester = new { r.Requester!.Id, r.Requester.FullName, r.Requester.Email },
            Department = r.Department!.Name, Company = r.Company!.Name,
            Approver = r.Approver == null ? null : new { r.Approver.Id, r.Approver.FullName },
            Items = r.Items.Select(i => new {
                i.Id, i.ItemId, i.Item!.Sku, i.Item.Name, i.Item.Unit,
                i.Qty, i.UnitPrice, Amount = i.Qty * i.UnitPrice
            })
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRequestDto dto)
    {
        var uid = CurrentUserId();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == uid);
        if (user == null) return Unauthorized(new { message = "โปรดล็อกอินก่อน" });
        if (dto.Items == null || !dto.Items.Any()) return BadRequest(new { message = "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ" });

        var itemIds = dto.Items.Select(i => i.ItemId).ToList();
        var items = await _db.Items.Where(i => itemIds.Contains(i.Id)).ToListAsync();

        var req = new Request
        {
            RequesterUserId = user.Id,
            CompanyId = user.CompanyId,
            DepartmentId = user.DepartmentId ?? 0,
            Status = RequestStatus.PendingApproval,
            Note = dto.Note,
            RequestNo = $"REQ-{DateTime.UtcNow:yyyyMM}-{Random.Shared.Next(1000, 9999)}",
        };
        foreach (var line in dto.Items)
        {
            var it = items.First(i => i.Id == line.ItemId);
            req.Items.Add(new RequestItem { ItemId = it.Id, Qty = line.Qty, UnitPrice = it.UnitPrice });
        }
        req.TotalAmount = req.Items.Sum(x => x.Qty * x.UnitPrice);
        _db.Requests.Add(req);
        await _db.SaveChangesAsync();

        var dept = await _db.Departments.FirstOrDefaultAsync(d => d.Id == req.DepartmentId);
        if (dept?.ManagerUserId != null)
            _db.Notifications.Add(new Notification
            {
                UserId = dept.ManagerUserId.Value,
                Title = "คำขอเบิกใหม่รออนุมัติ",
                Message = $"{user.FullName} ส่งคำขอ {req.RequestNo} ยอดรวม {req.TotalAmount:N0} บาท",
                LinkPath = "/approval",
            });
        await _db.SaveChangesAsync();
        return Ok(new { req.Id, req.RequestNo });
    }

    [HttpGet("pending-approval")]
    public async Task<IActionResult> PendingApproval()
    {
        var uid = CurrentUserId();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == uid);
        if (user == null) return Unauthorized();
        var deptIds = await _db.Departments.Where(d => d.ManagerUserId == uid).Select(d => d.Id).ToListAsync();
        var q = _db.Requests.Where(r => r.Status == RequestStatus.PendingApproval);
        if (user.Role != UserRole.Admin && user.Role != UserRole.HR && user.Role != UserRole.Executive)
            q = q.Where(r => deptIds.Contains(r.DepartmentId));
        var list = await q
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new {
                r.Id, r.RequestNo, r.CreatedAt, r.TotalAmount,
                Requester = r.Requester!.FullName, Department = r.Department!.Name,
                Items = r.Items.Count
            }).ToListAsync();
        return Ok(list);
    }

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApproveDto dto)
    {
        var uid = CurrentUserId();
        var req = await _db.Requests.Include(r => r.Requester).FirstOrDefaultAsync(r => r.Id == id);
        if (req == null) return NotFound();
        req.ApproverUserId = uid;
        req.ApprovedAt = DateTime.UtcNow;
        req.Status = dto.Approve ? RequestStatus.Approved : RequestStatus.Rejected;
        req.RejectReason = dto.Approve ? null : dto.RejectReason;
        await _db.SaveChangesAsync();

        _db.Notifications.Add(new Notification
        {
            UserId = req.RequesterUserId,
            Title = dto.Approve ? "คำขอของคุณได้รับการอนุมัติ" : "คำขอของคุณถูกปฏิเสธ",
            Message = dto.Approve
                ? $"{req.RequestNo} ได้รับการอนุมัติ รอ HR เตรียมของ"
                : $"{req.RequestNo} ถูกปฏิเสธ: {dto.RejectReason}",
            LinkPath = $"/my-requests/{req.Id}",
        });
        await _db.SaveChangesAsync();
        return Ok(new { req.Id, Status = req.Status.ToString() });
    }

    [HttpPost("{id:int}/prepare")]
    public async Task<IActionResult> Prepare(int id, [FromBody] PrepareDto dto)
    {
        var req = await _db.Requests.Include(r => r.Items).FirstOrDefaultAsync(r => r.Id == id);
        if (req == null) return NotFound();
        if (req.Status != RequestStatus.Approved && req.Status != RequestStatus.Preparing)
            return BadRequest(new { message = "สถานะไม่ถูกต้อง ต้องเป็นสถานะอนุมัติแล้ว" });

        req.PickupDate = dto.PickupDate;
        req.PickupTime = dto.PickupTime;
        req.PickupLocation = dto.PickupLocation;
        req.Status = RequestStatus.ReadyForPickup;

        foreach (var line in req.Items)
        {
            var it = await _db.Items.FindAsync(line.ItemId);
            if (it != null) it.StockQty = Math.Max(0, it.StockQty - line.Qty);
            _db.StockMovements.Add(new StockMovement
            {
                ItemId = line.ItemId, Qty = line.Qty, Type = StockMovementType.Issue,
                Reference = req.RequestNo, Note = "จ่ายให้ผู้เบิก",
            });
        }

        _db.Notifications.Add(new Notification
        {
            UserId = req.RequesterUserId,
            Title = "ของพร้อมให้มารับแล้ว",
            Message = $"{req.RequestNo} รับได้ที่ {dto.PickupLocation} วันที่ {dto.PickupDate:d MMM yyyy} เวลา {dto.PickupTime}",
            LinkPath = $"/my-requests/{req.Id}",
        });
        await _db.SaveChangesAsync();
        return Ok(new { req.Id, Status = req.Status.ToString() });
    }

    [HttpPost("{id:int}/pickup")]
    public async Task<IActionResult> Pickup(int id)
    {
        var req = await _db.Requests.FindAsync(id);
        if (req == null) return NotFound();
        req.Status = RequestStatus.Completed;
        await _db.SaveChangesAsync();
        return Ok(new { req.Id, Status = req.Status.ToString() });
    }

    [HttpGet("pick-list")]
    public async Task<IActionResult> PickList()
    {
        var list = await _db.Requests
            .Where(r => r.Status == RequestStatus.Approved || r.Status == RequestStatus.Preparing)
            .Include(r => r.Requester).Include(r => r.Department)
            .Include(r => r.Items).ThenInclude(i => i.Item)
            .OrderBy(r => r.CreatedAt)
            .Select(r => new {
                r.Id, r.RequestNo, Status = r.Status.ToString(),
                Requester = r.Requester!.FullName, Department = r.Department!.Name,
                r.CreatedAt, r.TotalAmount,
                Items = r.Items.Select(i => new { i.Item!.Sku, i.Item.Name, i.Qty, i.Item.Unit })
            }).ToListAsync();
        return Ok(list);
    }

    [HttpGet("ready-for-pickup")]
    public async Task<IActionResult> ReadyForPickup()
    {
        var list = await _db.Requests
            .Where(r => r.Status == RequestStatus.ReadyForPickup)
            .Include(r => r.Requester).Include(r => r.Department)
            .OrderBy(r => r.PickupDate)
            .Select(r => new {
                r.Id, r.RequestNo, Requester = r.Requester!.FullName,
                Department = r.Department!.Name, r.PickupDate, r.PickupTime, r.PickupLocation
            }).ToListAsync();
        return Ok(list);
    }
}
