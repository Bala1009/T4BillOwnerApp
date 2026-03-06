import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthState = {
  authtoken: string | null;
  ClientID: string | null;
  userDetails: any | null;
};

type AuthContextType = {
  authData: AuthState;
  setAuthData: (data: Partial<AuthState>) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authData, setAuthDataState] = useState<AuthState>({
    authtoken: null,
    ClientID: null,
    userDetails: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const authtoken = await AsyncStorage.getItem('authtoken');
        const ClientID = await AsyncStorage.getItem('ClientID');
        const userDetailsStr = await AsyncStorage.getItem('userDetails');
        const userDetails = userDetailsStr ? JSON.parse(userDetailsStr) : null;

        setAuthDataState({
          authtoken,
          ClientID,
          userDetails,
        });
      } catch (error) {
        console.error('Error loading auth data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []);

  const setAuthData = async (data: Partial<AuthState>) => {
    setAuthDataState((prev) => ({ ...prev, ...data }));
    
    try {
      if (data.authtoken !== undefined) {
        if (data.authtoken) await AsyncStorage.setItem('authtoken', data.authtoken);
        else await AsyncStorage.removeItem('authtoken');
      }
      if (data.ClientID !== undefined) {
        if (data.ClientID) await AsyncStorage.setItem('ClientID', data.ClientID);
        else await AsyncStorage.removeItem('ClientID');
      }
      if (data.userDetails !== undefined) {
        if (data.userDetails) await AsyncStorage.setItem('userDetails', JSON.stringify(data.userDetails));
        else await AsyncStorage.removeItem('userDetails');
      }
    } catch (error) {
      console.error('Error saving auth data', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authtoken');
      await AsyncStorage.removeItem('ClientID');
      await AsyncStorage.removeItem('userDetails');
      setAuthDataState({ authtoken: null, ClientID: null, userDetails: null });
    } catch (error) {
      console.error('Error during logout', error);
    }
  };

  return (
    <AuthContext.Provider value={{ authData, setAuthData, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
