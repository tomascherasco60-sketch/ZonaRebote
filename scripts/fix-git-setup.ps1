<#
  Ejecutar desde la raíz del repo:
  .\scripts\fix-git-setup.ps1 -UserName "Tu Nombre" -UserEmail "tu@correo.com" [-Origin "git@github.com:tuusuario/tu-repo.git"]
#>

param(
  [Parameter(Mandatory=$true)][string] $UserName,
  [Parameter(Mandatory=$true)][string] $UserEmail,
  [string] $Origin
)

Write-Host "Configurando git local en repo: $(Get-Location)" -ForegroundColor Cyan

# 1) Configurar identidad local
git config --local user.name "$UserName"
git config --local user.email "$UserEmail"
Write-Host "-> user.name and user.email set locally."

# 2) Core.autocrlf para evitar warnings LF/CRLF
git config --local core.autocrlf true
Write-Host "-> core.autocrlf set to true."

# 3) Añadir origin remoto si se pasó y no existe
if (-not (git remote | Select-String -Pattern '^origin$' -Quiet)) {
  if ($Origin) {
    Write-Host "Añadiendo remote origin -> $Origin"
    git remote add origin $Origin
  } else {
    Write-Host "No existe remote 'origin'. Pasa la URL como parámetro -Origin para añadirla (opcional)." -ForegroundColor Yellow
  }
} else {
  Write-Host "Remote 'origin' ya existe."
}

# 4) Intentar fetch del remote si existe
if (git remote | Select-String -Pattern '^origin$' -Quiet) {
  Write-Host "Haciendo git fetch origin..."
  git fetch origin --prune
} else {
  Write-Host "No hay remote origin, skip fetch." -ForegroundColor Yellow
}

# 5) Asegurar la rama main local y asociarla al remoto si existe
if (git rev-parse --verify main 2>$null) {
  Write-Host "La rama 'main' existe localmente."
  if (git ls-remote --heads origin main 2>$null) {
    git branch --set-upstream-to=origin/main main 2>$null | Out-Null
    Write-Host "-> main trackea origin/main."
  }
} else {
  if (git ls-remote --heads origin main 2>$null) {
    Write-Host "Creando rama main local desde origin/main"
    git checkout -b main origin/main
  } else {
    Write-Host "Creando rama main local vacía"
    git checkout -b main
    if (git remote | Select-String -Pattern '^origin$' -Quiet) {
      Write-Host "Intentando push para crear origin/main (puede pedir credenciales)..."
      git push -u origin main || Write-Host "Push falló: revisá permisos/remote." -ForegroundColor Yellow
    }
  }
}

Write-Host "Hecho. Verificá con: git config --local --list" -ForegroundColor Green
