using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StationeryApi.Data;
using StationeryApi.Models;

namespace StationeryApi.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    public AdminController(AppDbContext db) => _db = db;

    private int CurrentUserId()
    {
        var v = Request.Headers["X-User-Id"].FirstOrDefault();
        return int.TryParse(v, out var id) ? id : 0;
    }

    private async Task<bool> IsAdmin()
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == CurrentUserId());
        return u?.Role == UserRole.Admin;
    }

    private IActionResult ForbidNotAdmin() =>
        StatusCode(403, new { message = "เฉพาะผู้ดูแลระบบเท่านั้นที่มีสิทธิ์" });

    // ========== USERS ==========
    [HttpGet("users")]
    public async Task<IActionResult> Users() => Ok(await _db.Users
        .Include(u => u.Company).Include(u => u.Department)
        .OrderBy(u => u.FullName)
        .Select(u => new {
            u.Id, u.FullName, u.Email, Role = u.Role.ToString(), u.IsActive,
            u.CompanyId, Company = u.Company!.Name,
            u.DepartmentId, Department = u.Department == null ? null : u.Department.Name
        }).ToListAsync());

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] User u)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        if (string.IsNullOrWhiteSpace(u.Email) || string.IsNullOrWhiteSpace(u.FullName))
            return BadRequest(new { message = "กรุณากรอกชื่อและอีเมล" });
        u.Email = u.Email.Trim().ToLower();
        if (await _db.Users.AnyAsync(x => x.Email == u.Email))
            return BadRequest(new { message = "อีเมลนี้มีอยู่แล้ว" });
        u.Id = 0;
        _db.Users.Add(u);
        await _db.SaveChangesAsync();
        return Ok(u);
    }

    [HttpPut("users/{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] User u)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        var e = await _db.Users.FindAsync(id); if (e == null) return NotFound();
        e.FullName = u.FullName;
        e.Role = u.Role;
        e.CompanyId = u.CompanyId;
        e.DepartmentId = u.DepartmentId;
        e.IsActive = u.IsActive;
        // Allow email change but keep unique
        if (!string.IsNullOrWhiteSpace(u.Email) && !u.Email.Equals(e.Email, StringComparison.OrdinalIgnoreCase))
        {
            var newEmail = u.Email.Trim().ToLower();
            if (await _db.Users.AnyAsync(x => x.Email == newEmail && x.Id != id))
                return BadRequest(new { message = "อีเมลนี้มีอยู่แล้ว" });
            e.Email = newEmail;
        }
        await _db.SaveChangesAsync();
        return Ok(e);
    }

    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        if (id == CurrentUserId()) return BadRequest(new { message = "ไม่สามารถลบบัญชีตัวเองได้" });
        var e = await _db.Users.FindAsync(id); if (e == null) return NotFound();
        // Soft delete if user has requests to preserve history
        var hasRequests = await _db.Requests.AnyAsync(r => r.RequesterUserId == id);
        var isManager = await _db.Departments.AnyAsync(d => d.ManagerUserId == id);
        if (hasRequests || isManager)
        {
            e.IsActive = false;
            await _db.SaveChangesAsync();
            return Ok(new { deactivated = true, message = "ผู้ใช้มีประวัติในระบบ ระบบเปลี่ยนเป็น Inactive แทนการลบ" });
        }
        _db.Users.Remove(e);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    // ========== COMPANIES ==========
    [HttpGet("companies")]
    public async Task<IActionResult> Companies() =>
        Ok(await _db.Companies.OrderBy(c => c.Name).ToListAsync());

    [HttpPost("companies")]
    public async Task<IActionResult> AddCompany([FromBody] Company c)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        c.Id = 0;
        _db.Companies.Add(c);
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    [HttpPut("companies/{id:int}")]
    public async Task<IActionResult> UpdateCompany(int id, [FromBody] Company c)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        var e = await _db.Companies.FindAsync(id); if (e == null) return NotFound();
        e.Name = c.Name; e.Code = c.Code;
        await _db.SaveChangesAsync();
        return Ok(e);
    }

    [HttpDelete("companies/{id:int}")]
    public async Task<IActionResult> DeleteCompany(int id)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        var e = await _db.Companies.FindAsync(id); if (e == null) return NotFound();
        if (await _db.Users.AnyAsync(u => u.CompanyId == id))
            return BadRequest(new { message = "ยังมีผู้ใช้อยู่ในบริษัทนี้ ลบไม่ได้" });
        if (await _db.Departments.AnyAsync(d => d.CompanyId == id))
            return BadRequest(new { message = "ยังมีแผนกอยู่ในบริษัทนี้ ลบไม่ได้" });
        _db.Companies.Remove(e);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    // ========== DEPARTMENTS ==========
    [HttpGet("departments")]
    public async Task<IActionResult> Departments() => Ok(await _db.Departments
        .Include(d => d.Company).Include(d => d.Manager)
        .OrderBy(d => d.Company!.Name).ThenBy(d => d.Name)
        .Select(d => new {
            d.Id, d.Name, Company = d.Company!.Name, d.CompanyId,
            d.ManagerUserId, Manager = d.Manager == null ? null : d.Manager.FullName
        }).ToListAsync());

    [HttpPost("departments")]
    public async Task<IActionResult> AddDept([FromBody] Department d)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        d.Id = 0;
        _db.Departments.Add(d);
        await _db.SaveChangesAsync();
        return Ok(d);
    }

    [HttpPut("departments/{id:int}")]
    public async Task<IActionResult> UpdateDept(int id, [FromBody] Department d)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        var e = await _db.Departments.FindAsync(id); if (e == null) return NotFound();
        e.Name = d.Name;
        e.CompanyId = d.CompanyId;
        e.ManagerUserId = d.ManagerUserId;
        await _db.SaveChangesAsync();
        return Ok(e);
    }

    [HttpDelete("departments/{id:int}")]
    public async Task<IActionResult> DeleteDept(int id)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        var e = await _db.Departments.FindAsync(id); if (e == null) return NotFound();
        if (await _db.Users.AnyAsync(u => u.DepartmentId == id))
            return BadRequest(new { message = "ยังมีพนักงานในแผนกนี้ ลบไม่ได้" });
        if (await _db.Requests.AnyAsync(r => r.DepartmentId == id))
            return BadRequest(new { message = "แผนกนี้มีคำขอในระบบ ลบไม่ได้" });
        _db.Departments.Remove(e);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    // ========== CATEGORIES ==========
    [HttpGet("categories")]
    public async Task<IActionResult> Categories() =>
        Ok(await _db.Categories.OrderBy(c => c.Name).ToListAsync());

    [HttpPost("categories")]
    public async Task<IActionResult> AddCat([FromBody] Category c)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        c.Id = 0;
        _db.Categories.Add(c);
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    [HttpPut("categories/{id:int}")]
    public async Task<IActionResult> UpdateCat(int id, [FromBody] Category c)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        var e = await _db.Categories.FindAsync(id); if (e == null) return NotFound();
        e.Name = c.Name; e.NameEn = c.NameEn;
        await _db.SaveChangesAsync();
        return Ok(e);
    }

    [HttpDelete("categories/{id:int}")]
    public async Task<IActionResult> DeleteCat(int id)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        var e = await _db.Categories.FindAsync(id); if (e == null) return NotFound();
        if (await _db.Items.AnyAsync(i => i.CategoryId == id))
            return BadRequest(new { message = "หมวดหมู่นี้มีสินค้าอยู่ ลบไม่ได้" });
        _db.Categories.Remove(e);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    // ========== ITEMS ==========
    [HttpGet("items")]
    public async Task<IActionResult> Items() => Ok(await _db.Items.Include(i => i.Category)
        .OrderBy(i => i.Name)
        .Select(i => new {
            i.Id, i.Sku, i.Name, i.NameEn, i.Unit, i.UnitPrice, i.StockQty, i.ReorderLevel, i.IsActive,
            Category = i.Category!.Name, i.CategoryId
        }).ToListAsync());

    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] Item i)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        i.Id = 0;
        _db.Items.Add(i);
        await _db.SaveChangesAsync();
        return Ok(i);
    }

    [HttpPut("items/{id:int}")]
    public async Task<IActionResult> UpdateItem(int id, [FromBody] Item i)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        var e = await _db.Items.FindAsync(id); if (e == null) return NotFound();
        e.Sku = i.Sku; e.Name = i.Name; e.NameEn = i.NameEn; e.Unit = i.Unit;
        e.UnitPrice = i.UnitPrice; e.ReorderLevel = i.ReorderLevel; e.IsActive = i.IsActive;
        e.CategoryId = i.CategoryId;
        await _db.SaveChangesAsync();
        return Ok(e);
    }

    [HttpDelete("items/{id:int}")]
    public async Task<IActionResult> DeleteItem(int id)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        var e = await _db.Items.FindAsync(id); if (e == null) return NotFound();
        var used = await _db.RequestItems.AnyAsync(r => r.ItemId == id);
        if (used) { e.IsActive = false; await _db.SaveChangesAsync();
            return Ok(new { deactivated = true, message = "สินค้ามีในประวัติคำขอ ระบบเปลี่ยนเป็น Inactive แทน" }); }
        _db.Items.Remove(e);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    // ========== APPROVAL WORKFLOWS ==========
    [HttpGet("workflows")]
    public async Task<IActionResult> Workflows() => Ok(await _db.ApprovalWorkflows.ToListAsync());

    [HttpPost("workflows")]
    public async Task<IActionResult> AddWf([FromBody] ApprovalWorkflow w)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        w.Id = 0;
        _db.ApprovalWorkflows.Add(w);
        await _db.SaveChangesAsync();
        return Ok(w);
    }

    [HttpPut("workflows/{id:int}")]
    public async Task<IActionResult> UpdateWf(int id, [FromBody] ApprovalWorkflow w)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        var e = await _db.ApprovalWorkflows.FindAsync(id); if (e == null) return NotFound();
        e.Name = w.Name; e.CompanyId = w.CompanyId;
        e.AmountThreshold = w.AmountThreshold;
        e.Description = w.Description; e.IsActive = w.IsActive;
        await _db.SaveChangesAsync();
        return Ok(e);
    }

    [HttpDelete("workflows/{id:int}")]
    public async Task<IActionResult> DeleteWf(int id)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        var e = await _db.ApprovalWorkflows.FindAsync(id); if (e == null) return NotFound();
        _db.ApprovalWorkflows.Remove(e);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    // ========== NOTIFICATIONS ==========
    [HttpGet("notifications/{userId:int}")]
    public async Task<IActionResult> Notifications(int userId) =>
        Ok(await _db.Notifications.Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt).Take(50).ToListAsync());

    // ========== SETTINGS ==========
    [HttpGet("settings")]
    public async Task<IActionResult> Settings() =>
        Ok(await _db.SystemSettings.OrderBy(s => s.Key).ToListAsync());

    [HttpPost("settings")]
    public async Task<IActionResult> AddSetting([FromBody] SystemSetting s)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        if (await _db.SystemSettings.AnyAsync(x => x.Key == s.Key))
            return BadRequest(new { message = "Key ซ้ำในระบบ" });
        s.Id = 0;
        _db.SystemSettings.Add(s);
        await _db.SaveChangesAsync();
        return Ok(s);
    }

    [HttpPut("settings/{id:int}")]
    public async Task<IActionResult> UpdateSetting(int id, [FromBody] SystemSetting s)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        var e = await _db.SystemSettings.FindAsync(id); if (e == null) return NotFound();
        e.Value = s.Value; e.Description = s.Description;
        await _db.SaveChangesAsync();
        return Ok(e);
    }

    [HttpDelete("settings/{id:int}")]
    public async Task<IActionResult> DeleteSetting(int id)
    {
        if (!await IsAdmin()) return ForbidNotAdmin();
        var e = await _db.SystemSettings.FindAsync(id); if (e == null) return NotFound();
        _db.SystemSettings.Remove(e);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }
}
