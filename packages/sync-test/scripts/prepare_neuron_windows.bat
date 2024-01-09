SETLOCAL ENABLEDELAYEDEXPANSION

REM set time out
SET TIMEOUT_SECONDS=300
SET WAIT_SECONDS=5
SET ELAPSED_SECONDS=0
curl -O -L  http://github-test-logs.ckbapp.dev/neuron/sync/Neuron-v0.112.0-setup.exe

copy .\Neuron-*.exe Neuron-setup.exe
@echo off
REM install 
.\Neuron-setup.exe /S /D=D:\a\neuron\neuron\packages\sync-test\neuron

REM wait install successful
:CHECK_LOOP
tasklist | find "Neuron-setup.exe" > nul
if errorlevel 1 (
    echo Neuron install succ
    mkdir ".\source\bin"
    copy ".\neuron\bin\ckb.exe" ".\source\bin\ckb.exe"
    copy ".\neuron\bin\ckb-light-client.exe" ".\source\bin\ckb-light-client.exe"
    exit /b 0
) else (
		if !ELAPSED_SECONDS! GEQ %TIMEOUT_SECONDS% (
						echo Error: Timeout occurred while waiting for process to finish.
						exit /b 1
				) else (
						timeout /t %WAIT_SECONDS% /nobreak > nul
						SET /A ELAPSED_SECONDS+=WAIT_SECONDS
						goto :CHECK_LOOP
		)
)
