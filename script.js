const SERVICE_UUID = '0000180c-0000-1000-8000-00805f9b34fb';
const POT_CHAR_UUID = '00002a56-0000-1000-8000-00805f9b34fb';
let buttonCharacteristic;

async function connectBLE() {
  const status = document.getElementById('status');
  const potValue = document.getElementById('potValue');
  try {
    status.textContent = 'Requesting Bluetooth device...';
    status.className = '';
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'Nano33-Test' }],
      optionalServices: [SERVICE_UUID]
    });

    status.textContent = 'Connecting...';
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    const characteristic = await service.getCharacteristic(POT_CHAR_UUID);
    buttonCharacteristic = await service.getCharacteristic('00002a57-0000-1000-8000-00805f9b34fb');

    status.textContent = 'Connected to device!';
    status.className = 'success';

    setInterval(async () => {
      try {
        const value = await characteristic.readValue();
        const potValueInt = value.getUint16(0, true);
        console.log('Raw Potentiometer Value:', potValueInt);
        potValue.textContent = `Potentiometer Value: ${potValueInt}`;
      } catch (error) {
        console.error('Error reading potentiometer value:', error);
      }
    }, 500);

    device.addEventListener('gattserverdisconnected', () => {
      status.textContent = 'Disconnected from device';
      status.className = 'error';
      potValue.textContent = 'Potentiometer Value: N/A';
    });
  } catch (error) {
    console.error('Error:', error);
    status.textContent = 'Error: ' + error.message;
    status.className = 'error';
  }
}

function buttonClick(buttonId) {
  console.log(`Button ${buttonId} clicked`);
  if (buttonCharacteristic) {
    const value = new TextEncoder().encode(buttonId); // Encode the button ID as a string
    buttonCharacteristic.writeValue(value).then(() => {
      console.log(`Button ${buttonId} sent to Arduino`);
    }).catch(error => {
      console.error('Error sending button press:', error);
    });
  } else {
    console.error('Button characteristic not available');
  }
}

async function connectWiFi() {
  const ssid = document.getElementById('ssid').value;
  const password = document.getElementById('password').value;
  if (!ssid || !password) {
    alert('Please enter both SSID and password.');
    return;
  }

  console.log(`Connecting to Wi-Fi with SSID: ${ssid} and Password: ${password}`);
  if (buttonCharacteristic) {
    const wifiData = new TextEncoder().encode(`${ssid},${password}`);
    try {
      await buttonCharacteristic.writeValue(wifiData);
      alert('Wi-Fi credentials sent to the device.');
    } catch (error) {
      console.error('Error sending Wi-Fi credentials:', error);
      alert('Failed to send Wi-Fi credentials.');
    }
  } else {
    alert('BLE connection not established. Please connect to the BLE device first.');
  }
}