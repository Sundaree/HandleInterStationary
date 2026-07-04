using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StationeryApi.Data;
using StationeryApi.Dtos;

namespace StationeryApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    public AuthController(AppDbContext db) => _db = db;

    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login([FromBody] LoginRequest req)
    {
        var email = (req.Email ?? "").Trim().ToLower();
        if (string.IsNullOrEmpty(email))
            return BadRequest(new { message = "กรุณาระบุอีเมล" });

        var user = await _db.Users
            .Include(u => u.Company)
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email && u.IsActive);

        if (user == null)
            return Unauthorized(new { message = "ไม่พบผู้ใช้ในระบบ" });

        return new UserDto(user.Id, user.FullName, user.Email, user.Role.ToString(),
            user.CompanyId, user.Company?.Name ?? "",
            user.DepartmentId, user.Department?.Name);
    }
}
