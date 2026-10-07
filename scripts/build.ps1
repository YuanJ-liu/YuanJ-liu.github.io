$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$generatorPath = Join-Path $PSScriptRoot 'generate_page_metadata.py'

Set-Location $projectRoot
python $generatorPath
zensical build
