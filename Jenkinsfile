pipeline {
    agent none

    options {
        timestamps()
    }

    environment {
        GH_TOKEN = credentials('github-release-token')
        BACKEND_PORT = '8787'
        BACKEND_DEPLOY_PATH = 'C:\\jenkins-lab\\electron-chat-autoupdate-backend'
    }

    stages {
        stage('Build cliente Electron') {
            agent { label 'windows-electron' }
            steps {
                checkout scm
                powershell 'if (!(Test-Path package.json)) { throw "Falta package.json" }'
                powershell 'if (!(Test-Path src\\main.js)) { throw "Falta src\\main.js" }'
                powershell 'if (!(Test-Path server\\lan-signaling-server.js)) { throw "Falta server\\lan-signaling-server.js" }'
                powershell 'node --check server\\lan-signaling-server.js'
                powershell 'node -v'
                powershell 'npm -v'
                powershell 'gh --version'
                powershell 'npm ci'
                powershell 'npm run dist'
                powershell 'if (!(Test-Path dist\\latest.yml)) { throw "Falta latest.yml" }'
                powershell '$exe = Get-ChildItem dist -Filter *.exe | Select-Object -First 1; if (-not $exe) { throw "No se genero el instalador .exe" }'
                powershell '$blockmap = Get-ChildItem dist -Filter *.blockmap | Select-Object -First 1; if (-not $blockmap) { throw "No se genero .blockmap" }'
                archiveArtifacts artifacts: 'dist/*.exe, dist/*.blockmap, dist/latest.yml', fingerprint: true
                stash name: 'client-dist', includes: 'dist/**'
            }
        }

        stage('Desplegar backend local') {
            agent { label 'windows-electron' }
            steps {
                checkout scm
                powershell '''
                  $deployPath = $env:BACKEND_DEPLOY_PATH
                  $port = $env:BACKEND_PORT

                  New-Item -ItemType Directory -Force -Path $deployPath | Out-Null
                  New-Item -ItemType Directory -Force -Path (Join-Path $deployPath 'server') | Out-Null

                  Copy-Item package.json $deployPath -Force
                  Copy-Item package-lock.json $deployPath -Force
                  Copy-Item server\\lan-signaling-server.js (Join-Path $deployPath 'server\\lan-signaling-server.js') -Force

                  Push-Location $deployPath
                  npm ci --omit=dev
                  Pop-Location

                  $existing = Get-CimInstance Win32_Process | Where-Object {
                    $_.Name -eq 'node.exe' -and $_.CommandLine -like '*lan-signaling-server.js*'
                  }

                  foreach ($proc in $existing) {
                    try {
                      Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
                    } catch {
                    }
                  }

                  $stdout = Join-Path $deployPath 'backend.stdout.log'
                  $stderr = Join-Path $deployPath 'backend.stderr.log'
                  $pidFile = Join-Path $deployPath 'backend.pid'

                  $process = Start-Process -FilePath node `
                    -ArgumentList 'server\\lan-signaling-server.js' `
                    -WorkingDirectory $deployPath `
                    -WindowStyle Hidden `
                    -RedirectStandardOutput $stdout `
                    -RedirectStandardError $stderr `
                    -PassThru

                  Set-Content -Path $pidFile -Value $process.Id
                  Start-Sleep -Seconds 5

                  $response = Invoke-WebRequest -Uri \"http://localhost:$port\" -UseBasicParsing -TimeoutSec 10
                  if ($response.StatusCode -ne 200) {
                    throw \"El backend no respondio correctamente.\"
                  }
                '''
            }
        }

        stage('Publicar cliente en GitHub Releases') {
            agent { label 'windows-electron' }
            steps {
                checkout scm
                unstash 'client-dist'
                powershell '''
                  $version = (Get-Content package.json | ConvertFrom-Json).version
                  $tag = "v$version"
                  $assets = @(
                    (Get-ChildItem dist -Filter *.exe | Select-Object -First 1).FullName,
                    (Get-ChildItem dist -Filter *.blockmap | Select-Object -First 1).FullName,
                    (Resolve-Path dist\\latest.yml).Path
                  )

                  gh release view $tag 2>$null
                  if ($LASTEXITCODE -ne 0) {
                    gh release create $tag $assets --title $tag --notes "Release publicada automaticamente desde Jenkins."
                  } else {
                    gh release upload $tag $assets --clobber
                  }
                '''
            }
        }
    }
}
