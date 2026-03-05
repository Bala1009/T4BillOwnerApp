import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F172A',
    },
});
