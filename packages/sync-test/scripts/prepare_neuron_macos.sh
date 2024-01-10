wget http://github-test-logs.ckbapp.dev/neuron/sync/Neuron-v0.112.0-mac-x64.zip
cp Neuron*.zip Neuron.zip
unzip Neuron.zip
mv Neuron.app neuron
chmod 777 neuron/Contents
cp -r neuron/Contents/bin source/
wget https://github.com/nervosnetwork/ckb/releases/download/v0.113.0-rc3/ckb_v0.113.0-rc3_x86_64-apple-darwin-portable.zip
unzip ckb_v0.113.0-rc3_x86_64-apple-darwin-portable.zip
cp ckb_v0.113.0-rc3_x86_64-apple-darwin-portable/ckb source/bin/ckb
