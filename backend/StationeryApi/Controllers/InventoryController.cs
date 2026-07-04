using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StationeryApi.Data;
using StationeryApi.Dtos;
using StationeryApi.Models;

namespace StationeryApi.Controllers;

[ApiController]
[Route("api/inventory")]
public class InventoryController : ControllerBase
{
    private readonly AppDbContext _db;
    public InventoryController(AppDbContext db) => _db = db;

    private int CurrentUserId()
    {
        var v = Request.Headers["X-User-Id"].FirstOrDefault();
        return int.TryParse(v, out var id) ? id : 0;
    }

    [HttpGet("stock")]
    public async Task<IActionResult> Stock([FromQuery] bool? lowOnly)
    {
        var q = _db.Items.Include(i => i.Category).Where(i => i.IsActive);
        if (lowOnly == true) q = q.Where(i => i.StockQty <= i.ReorderLevel);
        var list = await q.OrderBy(i => i.Name).Select(i => new {
            i.Id, i.Sku, i.Name, i.NameEn, i.Unit, i.UnitPrice, i.StockQty, i.ReorderLevel,
            CategoryName = i.Category!.Name,
            IsLow = i.StockQty <= i.ReorderLevel
        }).ToListAsync();
        return Ok(list);
    }

    [HttpPost("receive")]
    public async Task<IActionResult> Receive([FromBody] ReceiveStockDto dto)
    {
        var it = await _db.Items.FindAsync(dto.ItemId);
        if (it == null) return NotFound();
        it.StockQty += dto.Qty;
        _db.StockMovements.Add(new StockMovement
        {
            ItemId = it.Id, Qty = dto.Qty, Type = StockMovementType.Receive,
            Reference = dto.Reference, Note = dto.Note, UserId = CurrentUserId(),
        });
        await _db.SaveChangesAsync();
        return Ok(new { it.Id, it.StockQty });
    }

    [HttpPost("adjust")]
    public async Task<IActionResult> Adjust([FromBody] StockAdjustDto dto)
    {
        var it = await _db.Items.FindAsync(dto.ItemId);
        if (it == null) return NotFound();
        var diff = dto.NewQty - it.StockQty;
        it.StockQty = dto.NewQty;
        _db.StockMovements.Add(new StockMovement
        {
            ItemId = it.Id, Qty = diff, Type = StockMovementType.Adjustment,
            Note = dto.Note, UserId = CurrentUserId(),
        });
        await _db.SaveChangesAsync();
        return Ok(new { it.Id, it.StockQty });
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> Transfer([FromBody] StockTransferDto dto)
    {
        var it = await _db.Items.FindAsync(dto.ItemId);
        if (it == null) return NotFound();
        _db.StockMovements.Add(new StockMovement
        {
            ItemId = it.Id, Qty = dto.Qty, Type = StockMovementType.Transfer,
            Reference = dto.ToLocation, Note = dto.Note, UserId = CurrentUserId(),
        });
        await _db.SaveChangesAsync();
        return Ok(new { it.Id });
    }

    [HttpGet("movements")]
    public async Task<IActionResult> Movements([FromQuery] int? itemId)
    {
        var q = _db.StockMovements.Include(m => m.Item).AsQueryable();
        if (itemId.HasValue) q = q.Where(m => m.ItemId == itemId.Value);
        var list = await q.OrderByDescending(m => m.OccurredAt).Take(200)
            .Select(m => new {
                m.Id, m.ItemId, ItemName = m.Item!.Name, Type = m.Type.ToString(),
                m.Qty, m.OccurredAt, m.Reference, m.Note
            }).ToListAsync();
        return Ok(list);
    }
}
