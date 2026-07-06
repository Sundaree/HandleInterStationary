using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using StationeryApi.Models;

namespace StationeryApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Npgsql's `timestamp with time zone` columns only accept DateTime with
    // Kind=Utc. JSON deserialization (e.g. PickupDate from the frontend) yields
    // Kind=Unspecified, so normalize every DateTime property on every save.
    public override int SaveChanges()
    {
        NormalizeDatesToUtc();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        NormalizeDatesToUtc();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void NormalizeDatesToUtc()
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State != EntityState.Added && entry.State != EntityState.Modified) continue;
            foreach (var prop in entry.Properties)
            {
                switch (prop.CurrentValue)
                {
                    case DateTime dt when dt.Kind != DateTimeKind.Utc:
                        prop.CurrentValue = DateTime.SpecifyKind(dt, DateTimeKind.Utc);
                        break;
                    case DateTimeOffset dto:
                        prop.CurrentValue = dto.ToUniversalTime();
                        break;
                }
            }
        }
    }

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
