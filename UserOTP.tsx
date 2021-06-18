import React, {FC, ReactElement, useState} from 'react';
import {Alert, Text, TextInput, TouchableOpacity, View} from 'react-native';
import Parse from 'parse/react-native';
import {useNavigation} from '@react-navigation/native';
import Styles from './Styles';

export const UserOTP: FC<{}> = ({}): ReactElement => {
  const navigation = useNavigation();

  const [userData, setUserData] = useState('');
  const [userToken, setUserToken] = useState('');
  const [tokenRequested, setTokenRequested] = useState(false);

  const requestOTP = async function (): Promise<boolean> {
    // Note that this values come from state variables that we've declared before
    const userDataValue: string = userData;
    // Check if value is an email if it contains @. Note that in a real
    // app you need a much better validator for this field
    const verificationType: string =
      userDataValue.includes('@') === true ? 'email' : 'sms';
    // We need to call it using await
    try {
      await Parse.Cloud.run('requestOTP', {
        userData: userDataValue,
        verificationType: verificationType,
      });
      // Show token input field
      setTokenRequested(true);
      Alert.alert('Success!', `Token requested via ${verificationType}!`);
      return true;
    } catch (error) {
      Alert.alert('Error!', error.message);
      return false;
    }
  };

  const verifyOTP = async function (): Promise<Boolean> {
    // Note that this values come from state variables that we've declared before
    const userDataValue: string = userData;
    const userTokenValue: string = userToken;
    // Check if value is an email if it contains @. Note that in a real
    // app you need a much better validator for this field
    const verificationType: string =
      userDataValue.includes('@') === true ? 'email' : 'sms';
    // We need the installation id to allow cloud code to create
    // a new session and login user without password
    const parseInstallationId: string = await Parse._getInstallationId();
    // We need to call it using await
    try {
      // Verify OTP, if successful, returns a sessionId
      let response: object = await Parse.Cloud.run('verifyOTP', {
        userData: userDataValue,
        verificationType: verificationType,
        userToken: userTokenValue,
        parseInstallationId: parseInstallationId,
      });
      if (response.sessionId !== undefined) {
        // Use generated sessionId to become a user,
        // logging in without needing to inform password and username
        await Parse.User.become(response.sessionId);
        const loggedInUser: Parse.User = await Parse.User.currentAsync();
        Alert.alert(
          'Success!',
          `User ${loggedInUser.get('username')} has successfully signed in!`,
        );
        // Navigation.navigate takes the user to the home screen
        navigation.navigate('Home');
        return true;
      } else {
        throw response;
      }
    } catch (error) {
      Alert.alert('Error!', error.message);
      return false;
    }
  };

  return (
    <View style={Styles.login_wrapper}>
      {tokenRequested === false ? (
        <View style={Styles.form}>
          <TextInput
            style={Styles.form_input}
            value={userData}
            placeholder={'Email or mobile phone number'}
            onChangeText={(text) => setUserData(text)}
            autoCapitalize={'none'}
            keyboardType={'email-address'}
          />
          <TouchableOpacity onPress={() => requestOTP()}>
            <View style={Styles.button}>
              <Text style={Styles.button_label}>{'Request OTP'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={Styles.form}>
          <Text>{'Inform the received token to proceed'}</Text>
          <TextInput
            style={Styles.form_input}
            value={userToken}
            placeholder={'Token (6 digits)'}
            onChangeText={(text) => setUserToken(text)}
            autoCapitalize={'none'}
            keyboardType={'default'}
          />
          <TouchableOpacity onPress={() => verifyOTP()}>
            <View style={Styles.button}>
              <Text style={Styles.button_label}>{'Verify'}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => requestOTP()}>
            <View style={Styles.button}>
              <Text style={Styles.button_label}>{'Resend token'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
