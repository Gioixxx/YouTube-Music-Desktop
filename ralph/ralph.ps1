# Ralph - Autonomous Development Loop for TobaccoManagement
# Adapted for Windows PowerShell and .NET projects

param(
    [Parameter(Mandatory = $true)]
    [int]$Iterations
)

$ErrorActionPreference = "Stop"

# Get the root directory (parent of ralph folder)
$RootDir = Split-Path -Parent $PSScriptRoot
$RalphDir = $PSScriptRoot

Write-Host "Ralph - Gestionale Tabacchi Autonomous Dev" -ForegroundColor Cyan
Write-Host "Root: $RootDir" -ForegroundColor Gray
Write-Host "Iterations: $Iterations" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

for ($i = 1; $i -le $Iterations; $i++) {
    Write-Host "`nIteration $i of $Iterations" -ForegroundColor Yellow
    Write-Host "--------------------------------" -ForegroundColor Yellow

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
        $result = claude -p $prompt --dangerously-skip-permissions 2>&1 | Out-String
        Write-Host $result

        # Check if PRD is complete
        if ($result -match "<promise>COMPLETE</promise>") {
            Write-Host "`nPRD COMPLETE after $i iterations!" -ForegroundColor Green
            # Optional: Windows notification
            [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null
            [System.Windows.Forms.MessageBox]::Show("Ralph completed the PRD after $i iterations!", "Ralph Complete", 'OK', 'Information')
            exit 0
        }
    }
    finally {
        Pop-Location
    }
}

Write-Host "`nCompleted $Iterations iterations. PRD may not be fully complete." -ForegroundColor Yellow
