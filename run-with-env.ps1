# Carrega o .env e sobe a aplicacao com java -jar (apos mvn package).
#
# Por que nao "mvn spring-boot:run"? No Windows o processo Java filho do Maven
# muitas vezes nao recebe SPRING_DATASOURCE_*; o Spring cai no default user "postgres"
# e o pooler Supabase falha. Com java -jar o processo herda 100% das variaveis deste PowerShell.
#
# Uso: .\run-with-env.ps1
# Desenvolvimento rapido (sem rebuild): mvn spring-boot:run com Postgres local / IDE.

Set-Location $PSScriptRoot

if (-not (Test-Path .env)) {
    Write-Host "Arquivo .env nao encontrado." -ForegroundColor Yellow
    exit 1
}

$envFile = Join-Path $PSScriptRoot '.env'
Get-Content $envFile -Encoding utf8 | ForEach-Object {
    $line = $_.TrimEnd("`r")
    if ($line -match '^\s*#' -or $line -match '^\s*$') { return }
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
        $name = $matches[1]
        $value = $matches[2].Trim()
        if ($value -match '^["''](.*)["'']$') { $value = $matches[1] }
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
        Set-Item -Path "Env:$name" -Value $value
    }
}

if ([string]::IsNullOrWhiteSpace($env:SPRING_DATASOURCE_URL)) {
    Write-Warning "SPRING_DATASOURCE_URL vazio apos ler .env."
}
if ([string]::IsNullOrWhiteSpace($env:SPRING_DATASOURCE_USERNAME)) {
    Write-Warning "SPRING_DATASOURCE_USERNAME vazio. No pooler Supabase use postgres.SEU_PROJECT_REF."
}

Write-Host "Variaveis do .env carregadas." -ForegroundColor Green
Write-Host "Datasource user: $env:SPRING_DATASOURCE_USERNAME" -ForegroundColor DarkGray
Write-Host "DB_SSLMODE: $(if ($env:DB_SSLMODE) { $env:DB_SSLMODE } else { '(vazio = disable, ok para Postgres local)' })" -ForegroundColor DarkGray

# Diagnostico: defina no .env JDBC_DEBUG=true para ver no log o que o Hikari usa (sem imprimir senha).
if ($env:JDBC_DEBUG -eq 'true') {
    $env:LOGGING_LEVEL_COM_ZAXXER_HIKARI = 'DEBUG'
    Write-Host "JDBC_DEBUG=true -> logs DEBUG do Hikari (URL/user no log)." -ForegroundColor Yellow
}

Write-Host "Compilando JAR (mvn package -DskipTests)..." -ForegroundColor Cyan
mvn -DskipTests package
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$targetDir = Join-Path $PSScriptRoot 'target'
$jar = Get-ChildItem $targetDir -Filter 'pokemon-amethyst*.jar' -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notmatch 'plain' } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $jar) {
    Write-Host "JAR nao encontrado em $targetDir (esperado pokemon-amethyst-*.jar)." -ForegroundColor Red
    exit 1
}

Write-Host "Iniciando: java -jar $($jar.Name)" -ForegroundColor Green
java -jar $jar.FullName
exit $LASTEXITCODE
