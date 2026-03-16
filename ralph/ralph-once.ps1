# Ralph - Single iteration for TobaccoManagement
# Use this for a single autonomous development session

$ErrorActionPreference = "Stop"

# Get the root directory (parent of ralph folder)
$RootDir = Split-Path -Parent $PSScriptRoot
$RalphDir = $PSScriptRoot

Write-Host "Ralph - Single Iteration Mode" -ForegroundColor Cyan
Write-Host "Root: $RootDir" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

# Read PRD and progress files
$prdPath = Join-Path $RalphDir "prd.json"

if (-not (Test-Path $prdPath)) {
    Write-Host "ERROR: prd.json not found at $prdPath" -ForegroundColor Red
    exit 1
}

# Build the prompt for Claude
$prompt = @"
@ralph/prd.json @ralph/progress.txt @ralph/bigplan.md

PROJECT CONTEXT:
- This is a WPF .NET application (TobaccoManagement)
- Build command: dotnet build src/TobaccoManagement.Desktop/TobaccoManagement.Desktop.csproj
- The project uses MVVM pattern with CommunityToolkit.Mvvm
- Database: SQLite with Entity Framework Core

INSTRUCTIONS:
1. Find the highest-priority feature to work on (lowest priority number with passes=false).
   Work ONLY on that single feature.
2. Implement the feature following existing code patterns.
3. Verify the build passes: dotnet build
4. Update the PRD (ralph/prd.json) marking the story as passes=true and adding notes.
5. Append your progress to ralph/progress.txt with a brief summary of implemented features.
6. Update ralph/bigplan.md marking the corresponding task as [x] (completed).
7. Make a git commit with a descriptive message.

CRITICAL RULES:
- ONLY work on ONE feature per iteration
- Follow existing code patterns and conventions
- Do NOT skip the build verification
- If the PRD is complete (all stories pass), output: <promise>COMPLETE</promise>
"@

# Run Claude with the prompt (with permissions for autonomous development)
Push-Location $RootDir
try {
    # Use --dangerously-skip-permissions for autonomous mode
    # Or use --allowedTools to specify allowed operations
    claude -p $prompt --dangerously-skip-permissions
}
finally {
    Pop-Location
}
