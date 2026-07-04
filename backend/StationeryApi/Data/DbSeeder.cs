using Microsoft.EntityFrameworkCore;
using StationeryApi.Models;

namespace StationeryApi.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Companies.AnyAsync()) return;

        var companies = new[]
        {
            new Company { Name = "บริษัท เอ จำกัด", Code = "COMP-A" },
            new Company { Name = "บริษัท บี จำกัด", Code = "COMP-B" },
            new Company { Name = "บริษัท ซี จำกัด", Code = "COMP-C" },
            new Company { Name = "บริษัท ดี จำกัด", Code = "COMP-D" },
            new Company { Name = "บริษัท อี จำกัด", Code = "COMP-E" },
        };
        db.Companies.AddRange(companies);
        await db.SaveChangesAsync();

        var deptNames = new[] { "IT", "HR", "Finance", "Sales", "Operations" };
        var departments = new List<Department>();
        foreach (var c in companies)
            foreach (var name in deptNames)
                departments.Add(new Department { Name = name, CompanyId = c.Id });
        db.Departments.AddRange(departments);
        await db.SaveChangesAsync();

        var compA = companies[0];
        var itDept = departments.First(d => d.CompanyId == compA.Id && d.Name == "IT");
        var hrDept = departments.First(d => d.CompanyId == compA.Id && d.Name == "HR");
        var finDept = departments.First(d => d.CompanyId == compA.Id && d.Name == "Finance");

        var users = new[]
        {
            new User { FullName = "สมชาย ใจดี", Email = "somchai@company-a.co.th",
                Role = UserRole.Employee, CompanyId = compA.Id, DepartmentId = itDept.Id },
            new User { FullName = "สุดา นักบริหาร (หัวหน้าแผนก IT)", Email = "manager.it@company-a.co.th",
                Role = UserRole.DepartmentManager, CompanyId = compA.Id, DepartmentId = itDept.Id },
            new User { FullName = "มานี HR กลาง", Email = "hr@company-a.co.th",
                Role = UserRole.HR, CompanyId = compA.Id, DepartmentId = hrDept.Id },
            new User { FullName = "ผู้ดูแลระบบ", Email = "admin@company-a.co.th",
                Role = UserRole.Admin, CompanyId = compA.Id, DepartmentId = itDept.Id },
            new User { FullName = "ท่าน CEO", Email = "ceo@company-a.co.th",
                Role = UserRole.Executive, CompanyId = compA.Id, DepartmentId = finDept.Id },
            new User { FullName = "อารีย์ พนักงาน", Email = "aree@company-a.co.th",
                Role = UserRole.Employee, CompanyId = compA.Id, DepartmentId = finDept.Id },
        };
        db.Users.AddRange(users);
        await db.SaveChangesAsync();

        itDept.ManagerUserId = users.First(u => u.Email == "manager.it@company-a.co.th").Id;
        db.Update(itDept);
        await db.SaveChangesAsync();

        var categories = new[]
        {
            new Category { Name = "เครื่องเขียน", NameEn = "Writing" },
            new Category { Name = "กระดาษ", NameEn = "Paper" },
            new Category { Name = "อุปกรณ์สำนักงาน", NameEn = "Office Supplies" },
            new Category { Name = "หมึกและตลับ", NameEn = "Ink & Toner" },
        };
        db.Categories.AddRange(categories);
        await db.SaveChangesAsync();

        var items = new[]
        {
            new Item { Sku = "PEN-001", Name = "ปากกาลูกลื่นน้ำเงิน",     NameEn = "Blue ballpoint pen",  Unit = "ด้าม", UnitPrice = 7m,   CategoryId = categories[0].Id, StockQty = 500, ReorderLevel = 50 },
            new Item { Sku = "PEN-002", Name = "ปากกาลูกลื่นดำ",         NameEn = "Black ballpoint pen", Unit = "ด้าม", UnitPrice = 7m,   CategoryId = categories[0].Id, StockQty = 380, ReorderLevel = 50 },
            new Item { Sku = "PCL-001", Name = "ดินสอ 2B",                NameEn = "Pencil 2B",           Unit = "แท่ง", UnitPrice = 5m,   CategoryId = categories[0].Id, StockQty = 260, ReorderLevel = 40 },
            new Item { Sku = "HLT-001", Name = "ปากกาไฮไลต์ เหลือง",     NameEn = "Highlighter yellow",  Unit = "ด้าม", UnitPrice = 15m,  CategoryId = categories[0].Id, StockQty = 120, ReorderLevel = 30 },
            new Item { Sku = "PAP-A4",  Name = "กระดาษ A4 80 แกรม",       NameEn = "A4 paper 80gsm",      Unit = "รีม",  UnitPrice = 120m, CategoryId = categories[1].Id, StockQty = 80,  ReorderLevel = 15 },
            new Item { Sku = "PAP-A5",  Name = "กระดาษ A5",               NameEn = "A5 paper",            Unit = "รีม",  UnitPrice = 80m,  CategoryId = categories[1].Id, StockQty = 45,  ReorderLevel = 10 },
            new Item { Sku = "STA-001", Name = "แม็กเย็บกระดาษ",           NameEn = "Stapler",             Unit = "อัน",  UnitPrice = 180m, CategoryId = categories[2].Id, StockQty = 40,  ReorderLevel = 10 },
            new Item { Sku = "STA-002", Name = "ลวดเย็บ",                  NameEn = "Staples",             Unit = "กล่อง",UnitPrice = 25m,  CategoryId = categories[2].Id, StockQty = 200, ReorderLevel = 30 },
            new Item { Sku = "FOL-001", Name = "แฟ้ม 2 ห่วง",              NameEn = "2-ring binder",       Unit = "เล่ม", UnitPrice = 95m,  CategoryId = categories[2].Id, StockQty = 60,  ReorderLevel = 15 },
            new Item { Sku = "TNR-HP1", Name = "หมึกพิมพ์ HP 12A",         NameEn = "HP Toner 12A",        Unit = "ตลับ", UnitPrice = 2200m,CategoryId = categories[3].Id, StockQty = 8,   ReorderLevel = 5  },
        };
        db.Items.AddRange(items);
        await db.SaveChangesAsync();

        var somchai = users.First(u => u.Email == "somchai@company-a.co.th");
        var req = new Request
        {
            RequestNo = $"REQ-{DateTime.UtcNow:yyyyMM}-0001",
            RequesterUserId = somchai.Id,
            DepartmentId = somchai.DepartmentId!.Value,
            CompanyId = somchai.CompanyId,
            Status = RequestStatus.PendingApproval,
            CreatedAt = DateTime.UtcNow.AddHours(-3),
            Note = "ขอเบิกใช้ประจำเดือน",
        };
        var it1 = items[0];
        var it2 = items[4];
        req.Items.Add(new RequestItem { ItemId = it1.Id, Qty = 3, UnitPrice = it1.UnitPrice });
        req.Items.Add(new RequestItem { ItemId = it2.Id, Qty = 2, UnitPrice = it2.UnitPrice });
        req.TotalAmount = req.Items.Sum(x => x.Qty * x.UnitPrice);
        db.Requests.Add(req);

        var wf = new[]
        {
            new ApprovalWorkflow { Name = "อนุมัติโดยหัวหน้าแผนก", CompanyId = null, AmountThreshold = 0m,     Description = "ทุกคำขอต้องผ่านหัวหน้าแผนก" },
            new ApprovalWorkflow { Name = "อนุมัติโดยผู้บริหาร",   CompanyId = null, AmountThreshold = 5000m,  Description = "ยอดเกิน 5,000 บาท ต้องผ่านผู้บริหารเพิ่ม" },
        };
        db.ApprovalWorkflows.AddRange(wf);

        var settings = new[]
        {
            new SystemSetting { Key = "PickupLocation", Value = "ห้อง HR ชั้น 3", Description = "สถานที่รับของเริ่มต้น" },
            new SystemSetting { Key = "PickupTime",     Value = "10:00 - 12:00", Description = "ช่วงเวลารับของ" },
            new SystemSetting { Key = "Currency",       Value = "THB",           Description = "สกุลเงิน" },
        };
        db.SystemSettings.AddRange(settings);

        await db.SaveChangesAsync();

        var mgr = users.First(u => u.Email == "manager.it@company-a.co.th");
        db.Notifications.Add(new Notification
        {
            UserId = mgr.Id,
            Title = "มีคำขอเบิกใหม่รออนุมัติ",
            Message = $"คำขอ {req.RequestNo} จาก {somchai.FullName} ({items[0].Name} x{3}, {items[4].Name} x{2})",
            LinkPath = "/approval",
        });
        await db.SaveChangesAsync();
    }
}
