#!/usr/bin/env pwsh
# Thin wrapper: all logic lives in the platform-neutral Node script.
$ErrorActionPreference = 'Stop'
node (Join-Path $PSScriptRoot 'dev.mjs') @args
exit $LASTEXITCODE
