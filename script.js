const SERVICE_UUID = '0000180c-0000-1000-8000-00805f9b34fb';
const POT_CHAR_UUID = '00002a56-0000-1000-8000-00805f9b34fb';
let buttonCharacteristic;

async function connectBLE() {
  const status = document.getElementById('status');
  try {
    status.textContent = 'Requesting Bluetooth device...';
    status.className = ''; // Reset status color
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'Arduino' }],
      optionalServices: [SERVICE_UUID]
    });

    status.textContent = 'Connecting...';
    status.className = ''; // Reset status color
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    buttonCharacteristic = await service.getCharacteristic('00002a57-0000-1000-8000-00805f9b34fb');

    status.textContent = 'Connected to BLE device!';
    status.className = 'success'; // Green text for success

    device.addEventListener('gattserverdisconnected', () => {
      status.textContent = 'Disconnected from BLE device';
      status.className = 'error'; // Red text for disconnection
    });
  } catch (error) {
    console.error('Error:', error);
    status.textContent = 'Error: ' + error.message;
    status.className = 'error'; // Red text for error
  }
}

async function connectWiFi() {
  const ssid = document.getElementById('ssid').value;
  const password = document.getElementById('password').value;
  const status = document.getElementById('status');
  if (!ssid || !password) {
    status.textContent = 'Please enter both SSID and password.';
    status.className = 'error'; // Red text for error
    return;
  }

  if (buttonCharacteristic) {
    const wifiCredentials = `${ssid},${password}\n`; // Add a terminator character
    const encoder = new TextEncoder();
    const data = encoder.encode(wifiCredentials);

    console.log(`Sending Wi-Fi credentials: ${wifiCredentials}`);
    console.log(`Encoded data length: ${data.length}`);
    console.log(`Encoded data: ${Array.from(data)}`);

    try {
      await buttonCharacteristic.writeValue(data);
      status.textContent = 'Wi-Fi credentials sent.';
      status.className = 'success'; // Green text for success
    } catch (error) {
      console.error('Error sending Wi-Fi credentials:', error);
      status.textContent = 'Failed to send Wi-Fi credentials.';
      status.className = 'error'; // Red text for error
    }
  } else {
    status.textContent = 'BLE connection not established.';
    status.className = 'error'; // Red text for error
  }
}