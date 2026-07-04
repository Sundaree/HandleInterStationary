using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StationeryApi.Data;

namespace StationeryApi.Controllers;

[ApiController]
[Route("api/catalog")]
public class CatalogController : ControllerBase
{
    private readonly AppDbContext _db;
    public CatalogController(AppDbContext db) => _db = db;

    [HttpGet("categories")]
    public async Task<IActionResult> Categories()
        => Ok(await _db.Categories.OrderBy(c => c.Name).ToListAsync());

    [HttpGet("items")]
    public async Task<IActionResult> Items([FromQuery] string? q, [FromQuery] int? categoryId)
    {
        var query = _db.Items.Include(i => i.Category).Where(i => i.IsActive);
        if (categoryId.HasValue) query = query.Where(i => i.CategoryId == categoryId.Value);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var t = q.Trim();
            query = query.Where(i => i.Name.Contains(t) || i.NameEn.Contains(t) || i.Sku.Contains(t));
        }
        var list = await query.OrderBy(i => i.Name)
            .Select(i => new {
                i.Id, i.Sku, i.Name, i.NameEn, i.Unit, i.UnitPrice, i.StockQty, i.ReorderLevel,
                CategoryName = i.Category!.Name
            }).ToListAsync();
        return Ok(list);
    }
}
