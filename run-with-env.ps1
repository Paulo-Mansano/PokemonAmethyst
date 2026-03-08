# Carrega as variaveis do .env e roda o Spring Boot.
# Uso: .\run-with-env.ps1
# (O Maven nao le o arquivo .env automaticamente.)

if (-not (Test-Path .env)) {
    Write-Host "Arquivo .env nao encontrado. Crie a partir de .env.example e preencha com os dados do Supabase." -ForegroundColor Yellow
    exit 1
}

Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$' -and $_ -notmatch '^\s*#') {
        $name = $matches[1]
        $value = $matches[2].Trim()
        if ($value -match '^["''](.*)["'']$') { $value = $matches[1] }
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

Write-Host "Variaveis do .env carregadas. Iniciando Spring Boot..." -ForegroundColor Green
mvn spring-boot:run
