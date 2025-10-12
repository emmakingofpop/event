
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function Header() {
      const { colors } = useTheme();
      const { user } = useAuth();
      
        const goTo = () => {
          router.push("/ProfileScreen");
        }

    return (
      
              
              <View style={styles.header}>
                <View style={{flexDirection: 'row',alignItems:'center'}}>
                  
                    <Image
                      source={require('../../assets/images/logo.jpg')}
                      style={{ width: 50, height: 50, borderRadius: 16 }}
                    />
                 
                  <Text style={[styles.headerTitle, { color: colors.text }]}>LEVRAI</Text>
                </View>
                <TouchableOpacity
                  onPress={() => goTo()}
                >
                  <Text style={{color: colors.text,backgroundColor:colors.border,width:30,height:30,textAlign:'center',paddingTop:3,borderRadius:100}}>
                    {user?.username && user?.username[0]}
                  </Text>
                </TouchableOpacity>
              </View>
        
     
    )
  }

  const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent:'space-between',marginBottom: 16 },
    headerTitle: { fontSize: 24, fontWeight: '700', marginLeft: 8 },
  })


export default Header
