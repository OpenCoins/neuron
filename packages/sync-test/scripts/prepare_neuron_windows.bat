curl -O -L  http://github-test-logs.ckbapp.dev/neuron/sync/Neuron-v0.112.0-setup.exe
move .\Neuron-*.exe Neuron-setup.exe
.\Neuron-setup.exe /S /D=D:\a\neuron\neuron\packages\sync-test\neuron
mkdir ".\source\bin"
copy ".\neuron\bin\ckb.exe" ".\source\bin\ckb.exe"
copy ".\neuron\bin\ckb-light-client.exe" ".\source\bin\ckb-light-client.exe"
