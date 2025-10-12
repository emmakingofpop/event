import React from 'react';
import { Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

type Props = {
  value:string;
};


export default function QRCodeScreen({value}: Props) {
  
  return (
    <View>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Your QR Code:</Text>
      <QRCode
        value={value}
        size={200}
        color="black"
        backgroundColor="white"
      />
    </View>
  );
}
