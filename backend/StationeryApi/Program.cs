using Microsoft.EntityFrameworkCore;
using StationeryApi.Data;

// Npgsql 6+ rejects DateTime with Kind=Unspecified for `timestamp with time zone`
// columns. This legacy switch lets Npgsql accept any Kind and treat it as UTC —
// acceptable here because every DateTime we persist is either DateTime.UtcNow
// or normalized to UTC in controllers before saving.
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connString = builder.Configuration.GetConnectionString("Default")
    ?? "Host=localhost;Port=5432;Database=stationery_db;Username=postgres;Password=postgres";
builder.Services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(connString));

const string CorsPolicy = "AllowFrontend";
builder.Services.AddCors(o => o.AddPolicy(CorsPolicy, p => p
    .WithOrigins("http://localhost:4200")
    .AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    await DbSeeder.SeedAsync(db);
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors(CorsPolicy);
app.MapControllers();

app.Run();
