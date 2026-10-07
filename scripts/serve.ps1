$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$generatorPath = Join-Path $PSScriptRoot 'generate_page_metadata.py'
$generator = Start-Process `
    -FilePath 'python' `
    -ArgumentList @($generatorPath, '--watch') `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -PassThru

try {
    Set-Location $projectRoot
    zensical serve --open
}
finally {
    if (-not $generator.HasExited) {
        Stop-Process -Id $generator.Id
    }
}
