wget http://github-test-logs.ckbapp.dev/neuron/sync/Neuron-v0.112.0-mac-x64.zip
cp Neuron*.zip Neuron.zip
unzip Neuron.zip
mv Neuron.app neuron
chmod 777 neuron/Contents
cp -r neuron/Contents/bin source/
