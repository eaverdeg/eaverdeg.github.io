const SERVICE_UUID = '0000180c-0000-1000-8000-00805f9b34fb'; // Custom service UUID
const POT_CHAR_UUID = '00002a56-0000-1000-8000-00805f9b34fb'; // Potentiometer characteristic UUID
let buttonCharacteristic;

async function connectBLE() {
  const status = document.getElementById('status');
  const potValue = document.getElementById('potValue');
  try {
    status.textContent = 'Requesting Bluetooth device...';
    status.className = ''; // Reset status class
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'Nano33-Test' }],
      optionalServices: [SERVICE_UUID]
    });

    status.textContent = 'Connecting...';
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    characteristic = await service.getCharacteristic(POT_CHAR_UUID);
    buttonCharacteristic = await service.getCharacteristic('00002a57-0000-1000-8000-00805f9b34fb'); // Button characteristic

    status.textContent = 'Connected to device!';
    status.className = 'success'; // Set status to green

    // Read potentiometer value periodically
    setInterval(async () => {
      try {
        const value = await characteristic.readValue();
        const potValueInt = value.getUint16(0, true); // Read as 16-bit unsigned integer
        console.log('Raw Potentiometer Value:', potValueInt); // Log raw value
        potValue.textContent = `Potentiometer Value: ${potValueInt}`;
      } catch (error) {
        console.error('Error reading potentiometer value:', error);
      }
    }, 500);

    device.addEventListener('gattserverdisconnected', () => {
      status.textContent = 'Disconnected from device';
      status.className = 'error'; // Set status to red
      potValue.textContent = 'Potentiometer Value: N/A';
    });
  } catch (error) {
    console.error('Error:', error);
    status.textContent = 'Error: ' + error.message;
    status.className = 'error'; // Set status to red
  }
}

function buttonClick(buttonNumber) {
  console.log(`Button ${buttonNumber} clicked`);
  if (buttonCharacteristic) {
    const value = new Uint8Array([buttonNumber]);
    buttonCharacteristic.writeValue(value).then(() => {
      console.log(`Button ${buttonNumber} sent to Arduino`);
    }).catch(error => {
      console.error('Error sending button press:', error);
    });
  } else {
    console.error('Button characteristic not available');
  }
}