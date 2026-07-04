using Microsoft.EntityFrameworkCore;
using StationeryApi.Models;

namespace StationeryApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<Request> Requests => Set<Request>();
    public DbSet<RequestItem> RequestItems => Set<RequestItem>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ApprovalWorkflow> ApprovalWorkflows => Set<ApprovalWorkflow>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<Department>()
            .HasOne(d => d.Manager)
            .WithMany()
            .HasForeignKey(d => d.ManagerUserId)
            .OnDelete(DeleteBehavior.SetNull);

        b.Entity<Request>()
            .HasOne(r => r.Approver)
            .WithMany()
            .HasForeignKey(r => r.ApproverUserId)
            .OnDelete(DeleteBehavior.SetNull);

        b.Entity<Request>()
            .HasOne(r => r.Requester)
            .WithMany()
            .HasForeignKey(r => r.RequesterUserId)
            .OnDelete(DeleteBehavior.Restrict);

        b.Entity<Item>()
            .Property(i => i.UnitPrice).HasPrecision(12, 2);
        b.Entity<Request>()
            .Property(r => r.TotalAmount).HasPrecision(14, 2);
        b.Entity<RequestItem>()
            .Property(r => r.UnitPrice).HasPrecision(12, 2);
        b.Entity<ApprovalWorkflow>()
            .Property(a => a.AmountThreshold).HasPrecision(14, 2);

        b.Entity<User>().HasIndex(u => u.Email).IsUnique();
        b.Entity<Item>().HasIndex(i => i.Sku).IsUnique();
        b.Entity<Request>().HasIndex(r => r.RequestNo).IsUnique();
    }
}
