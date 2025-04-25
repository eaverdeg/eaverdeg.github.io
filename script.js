const SERVICE_UUID = '0000180c-0000-1000-8000-00805f9b34fb';
const POT_CHAR_UUID = '00002a56-0000-1000-8000-00805f9b34fb';
const WIFI_STATUS_CHAR_UUID = '00002a58-0000-1000-8000-00805f9b34fb';
let buttonCharacteristic;
let wifiStatusCharacteristic;

async function connectBLE() {
  const status = document.getElementById('status');
  const potValue = document.getElementById('potValue');
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
    const characteristic = await service.getCharacteristic(POT_CHAR_UUID);
    buttonCharacteristic = await service.getCharacteristic('00002a57-0000-1000-8000-00805f9b34fb');
    wifiStatusCharacteristic = await service.getCharacteristic(WIFI_STATUS_CHAR_UUID);

    status.textContent = 'Connected to device!';
    status.className = 'success'; // Green text for success

    // Listen for Wi-Fi status notifications
    await wifiStatusCharacteristic.startNotifications();
    wifiStatusCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
      const value = new TextDecoder().decode(event.target.value);
      if (value === 'Wi-Fi Connected') {
        status.textContent = 'Wi-Fi Connected!';
        status.className = 'success'; // Green text for success
      } else {
        status.textContent = 'Wi-Fi Connection Failed!';
        status.className = 'error'; // Red text for error
      }
    });

    // Periodically read potentiometer value
    setInterval(async () => {
      try {
        const value = await characteristic.readValue();
        const potValueInt = value.getUint16(0, true);
        potValue.textContent = `Potentiometer Value: ${potValueInt}`;
      } catch (error) {
        console.error('Error reading potentiometer value:', error);
      }
    }, 500);

    device.addEventListener('gattserverdisconnected', () => {
      status.textContent = 'Disconnected from device';
      status.className = 'error'; // Red text for disconnection
      potValue.textContent = 'Potentiometer Value: N/A';
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

    const chunkSize = 20; // BLE write limit
    try {
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        console.log(`Sending chunk: ${new TextDecoder().decode(chunk)}`);
        await buttonCharacteristic.writeValue(chunk);
        await new Promise(resolve => setTimeout(resolve, 100)); // Add a small delay between chunks
      }
      status.textContent = 'Wi-Fi credentials sent to the device.';
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