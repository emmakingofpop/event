import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'blue',
  },
  text: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});


const home = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello Expo</Text>
    </View>
  )
}

export default home


