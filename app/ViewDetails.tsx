import SwipeableImage from '@/components/SwipeableImage';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';
import { GestureHandlerRootView } from "react-native-gesture-handler";

const ViewDetails = () => {
  const { item } = useAuth();

  
  return (
    
        <GestureHandlerRootView style={{flex:1,alignItems:'center',justifyContent:'flex-start'}}>
        {item?.images && item?.images.length > 0 && <SwipeableImage
            images={item?.images as string[]}
        />}
        </GestureHandlerRootView>
        
    
  )
}

export default ViewDetails