import { Alert, StyleSheet, Text, TouchableOpacity, View, ToastAndroid } from 'react-native';
import { React, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';

const AddReminder = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const navigation = useNavigation();
    const route = useRoute();

    const checkNotificationPermission = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            const { status: newStatus } = await Notifications.requestPermissionsAsync();
            return newStatus === 'granted';
        }
        return true;
    };

    const handleAddReminder = async () => {
        console.log("çalıştı");
        const hasPermission = await checkNotificationPermission();
        if (!hasPermission) {
            Alert.alert(
                'İzin Gerekli',
                'Hatırlatıcı oluşturmak için bildirim izni vermelisiniz',
                [{ text: 'Tamam' }]
            );
            return;
        }

        const triggerDate = new Date(selectedDate); // 2 dakika
        triggerDate.setHours(selectedTime.getHours());
        triggerDate.setMinutes(selectedTime.getMinutes());
        triggerDate.setSeconds(0);

        console.log(triggerDate);

        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Yeni Hatırlatıcı',
                    body: 'Notunuz için hatırlatma!',
                    channelId: "reminders"
                },
                trigger: { date: triggerDate },
            });

            ToastAndroid.showWithGravity(
                `Hatırlatıcı ${triggerDate.toLocaleString('tr-TR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })} tarihine ayarlandı`,
                ToastAndroid.LONG,
                ToastAndroid.BOTTOM
            );

            navigation.navigate('AddNote', {
                note: route.params?.note, // Önceki not içeriği
                reminderDate: triggerDate.toISOString(), // Hatırlatıcı tarihi
            });
        } catch (error) {
            Alert.alert('Hata', 'Hatırlatıcı ayarlanamadı: ' + error.message);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setSelectedDate(selectedDate);
        }
    };

    // Saat seçim handler'ı
    const handleTimeChange = (event, selectedTime) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const newDateTime = new Date(selectedDate);
            newDateTime.setHours(selectedTime.getHours());
            newDateTime.setMinutes(selectedTime.getMinutes());
            setSelectedTime(newDateTime);
        }
    };


    const formatDate = (date) => {
        const monthsTR = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];

        return `${date.getDate()} ${monthsTR[date.getMonth()]} ${date.getFullYear()}`;
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    return (
        <View style={styles.container}>

            <View style={styles.header}>

                <Text style={styles.headerText}>Hatırlatıcı</Text>

            </View>

            <View style={styles.dateSelectContainer}>

                <TouchableOpacity style={styles.selectButtons}
                    onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.selectButtonsText}>Tarih seçin</Text>
                </TouchableOpacity>

                <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>

            </View>

            <View style={styles.dateSelectContainer}>

                <TouchableOpacity style={styles.selectButtons}
                    onPress={() => setShowTimePicker(true)}>
                    <Text style={styles.selectButtonsText}>Saat seçin</Text>
                </TouchableOpacity>

                <Text style={styles.selectedDateText}>{formatTime(selectedTime)}</Text>

            </View>

            <View style={styles.buttonsContainer}>

                <TouchableOpacity style={[styles.buttons,
                { backgroundColor: "rgb(200, 200, 200)" }]}>
                    <Text style={[styles.buttonText,
                    { color: "rgb(20,20,20)" }
                    ]}>İptal</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.buttons,
                { backgroundColor: "rgb(36, 85, 232)" }
                ]} onPress={handleAddReminder}>
                    <Text style={[styles.buttonText,
                    { color: "white" }
                    ]}>Onayla</Text>
                </TouchableOpacity>

            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                />
            )}

            {showTimePicker && (
                <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display="spinner"
                    onChange={handleTimeChange}
                    is24Hour={true}
                />
            )}

        </View>
    )
}

export default AddReminder

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "rgb(244,244,244)",
        paddingTop: 30
    },

    header: {
        backgroundColor: "red",
        padding: 15,
        backgroundColor: "rgb(230,230,230)",
        marginBottom: 80
    },

    headerText: {
        fontSize: 24,
        fontWeight: 700
    },

    dateSelectContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 50
    },

    selectButtons: {
        backgroundColor: "rgb(220,220,220)",
        padding: 16,
        width: "40%",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12
    },

    selectButtonsText: {
        fontSize: 20,
        fontWeight: 600
    },

    selectedDateText: {
        fontSize: 20,
        fontWeight: 600
    },

    buttonsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 50,
        marginTop: 80
    },

    buttons: {
        padding: 15,
        borderRadius: 15,
        width: "42%",
        justifyContent: "center",
        alignItems: "center"
    },

    buttonText: {
        fontSize: 18,
        fontWeight: 600
    }
})