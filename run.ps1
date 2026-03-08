# Carrega variáveis do .env e executa a aplicação Spring Boot.
# Uso: .\run.ps1

$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Aviso: arquivo .env nao encontrado. Usando valores padrao do application.yml." -ForegroundColor Yellow
} else {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remove aspas se existirem
            if ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            Set-Item -Path "Env:$name" -Value $value
        }
    }
    Write-Host "Variaveis do .env carregadas." -ForegroundColor Green
}

mvn spring-boot:run
