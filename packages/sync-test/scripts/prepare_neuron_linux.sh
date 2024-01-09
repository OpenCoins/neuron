wget http://github-test-logs.ckbapp.dev/neuron/sync/Neuron-v0.112.0-x86_64.AppImage
cp Neuron-*.AppImage Neuron.AppImage
chmod 777  Neuron.AppImage
./Neuron.AppImage --appimage-extract
mkdir neuron
mv squashfs-root neuron
cp -r neuron/squashfs-root/bin source/
