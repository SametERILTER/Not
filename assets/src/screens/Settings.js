import { ScrollView, StyleSheet, Text, Alert, TouchableOpacity, View, Modal, StatusBar } from 'react-native';
import { React, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import colors from "./../../color";
import * as Updates from 'expo-updates'; // expo-updates kütüphanesini içe aktar
import * as Notifications from 'expo-notifications';

const Settings = () => {
    const [isDarkTheme, setIsDarkTheme] = useState("light"); // Varsayılan tema açık
    const [themeModalVisible, setThemeModalVisible] = useState(false); // Modal görünürlüğü
    const [isGridView, setIsGridView] = useState(false); // Izgara görünümü için state

    const clearAllData = async () => {
        try {
            await AsyncStorage.clear(); // AsyncStorage'daki tüm verileri temizle
            await Notifications.cancelAllScheduledNotificationsAsync(); // Tüm planlanmış bildirimleri iptal et
            Alert.alert('Başarılı', 'Tüm veriler silindi.'); // Başarılı mesajı
            await Updates.reloadAsync();
        } catch (error) {
            Alert.alert('Hata', 'Veriler silinirken bir hata oluştu.'); // Hata mesajı
        }
    };

    const handleDeletePress = () => {
        Alert.alert(
            'Emin misiniz?',
            'Tüm verileri silmek istediğinize emin misiniz? Bu işlem geri alınamaz. Veriler silindikten sonra uygulama tekrar başlatılacaktır.',
            [
                {
                    text: 'Hayır',
                    onPress: () => console.log('Silme iptal edildi'),
                    style: 'cancel',
                },
                {
                    text: 'Evet',
                    onPress: clearAllData, // Onaylandığında verileri sil
                },
            ],
            { cancelable: false }
        );
    };

    useEffect(() => {
        // Uygulama açıldığında görünüm ayarını AsyncStorage'dan çek
        const loadViewSetting = async () => {
            const storedViewSetting = await AsyncStorage.getItem('viewSetting');

            if (storedViewSetting) {
                setIsGridView(JSON.parse(storedViewSetting));
            }
        };

        loadViewSetting();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const loadThemeSetting = async () => {
                const storedThemeSetting = await AsyncStorage.getItem('themeSetting');
                console.log("Tema depolama: ", storedThemeSetting);

                if (storedThemeSetting) {
                    setIsDarkTheme(JSON.parse(storedThemeSetting));
                    console.log("Uygulama teması: ", isDarkTheme);

                }
            };

            loadThemeSetting();
        }, [])
    );

    const toggleTheme = async (theme) => {
        setIsDarkTheme(theme);
        await AsyncStorage.setItem('themeSetting', JSON.stringify(theme)); // Yeni ayarı kaydet
        setThemeModalVisible(false); // Modali kapat
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: isDarkTheme === "light" ? colors.light.mainBackground : colors.dark.mainBackground }]}
            contentContainerStyle={{ paddingBottom: 40 }}>

            <StatusBar
                translucent={false}
                backgroundColor={isDarkTheme === "light" ? colors.light.mainBackground : colors.dark.mainBackground}
                barStyle={isDarkTheme === "light" ? 'dark-content' : 'light-content'}
            />

            <View style={styles.headerModern}>
                <Text style={[styles.headerTextModern, { color: isDarkTheme === "light" ? colors.light.text : colors.dark.text }]}>Ayarlar</Text>
            </View>

            <View style={styles.cardsContainer}>
                <TouchableOpacity style={[styles.card, isDarkTheme === "light" ? styles.cardLight : styles.cardDark]} onPress={() => setThemeModalVisible(true)}>
                    <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { color: isDarkTheme === "light" ? colors.light.text : colors.dark.text }]}>Tema</Text>
                        <View style={[styles.cardBadge, isDarkTheme === "light" && styles.cardBadgeLight, isDarkTheme === "dark" && styles.cardBadgeDark]}>
                            <Text style={[styles.cardBadgeText, { color: isDarkTheme === "light" ? '#222' : '#fff' }]}>{isDarkTheme === "light" ? "Açık" : "Koyu"}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                <View style={[styles.card, isDarkTheme === "light" ? styles.cardLight : styles.cardDark]}>
                    <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { color: isDarkTheme === "light" ? colors.light.text : colors.dark.text }]}>Not görünümü</Text>
                        <View style={[styles.cardBadge, isGridView ? styles.cardBadgeActive : null]}>
                            <Text style={[styles.cardBadgeText, { color: isDarkTheme === "light" ? '#222' : '#fff' }]}>{isGridView ? "Izgara" : "Liste"}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.deleteAllContainerModern}>
                <TouchableOpacity style={styles.deleteAllButtonModern} onPress={handleDeletePress}>
                    <Text style={styles.deleteAllTextModern}>Tüm verileri sil</Text>
                </TouchableOpacity>
            </View>

            <Modal
                animationType="fade"
                transparent={true}
                visible={themeModalVisible}
                onRequestClose={() => setThemeModalVisible(false)}
            >
                <View style={styles.modalContainerModern}>
                    <View style={[styles.modalContentModern, { backgroundColor: isDarkTheme === "light" ? colors.light.inputBackground : colors.dark.inputBackground }]}> 
                        <Text style={[styles.modalTitleModern, { color: isDarkTheme === "light" ? colors.light.text : colors.dark.text }]}>Tema Seçin</Text>
                        <TouchableOpacity onPress={() => toggleTheme('light')} style={[styles.themeOptionModern, isDarkTheme === "light" && { backgroundColor: '#eaeaea' }]}> 
                            <Text style={[styles.themeTextModern, { color: isDarkTheme === "light" ? '#222' : '#fff', fontWeight: isDarkTheme === "light" ? 'bold' : 'normal' }]}>Açık Tema</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => toggleTheme('dark')} style={[styles.themeOptionModern, isDarkTheme === "dark" && { backgroundColor: '#222' }]}> 
                            <Text style={[styles.themeTextModern, { color: isDarkTheme === "dark" ? '#fff' : '#222', fontWeight: isDarkTheme === "dark" ? 'bold' : 'normal' }]}>Koyu Tema</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setThemeModalVisible(false)} style={styles.closeButtonModern}>
                            <Text style={styles.closeButtonTextModern}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    )
}

export default Settings

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "rgb(244,244,244)",
        paddingTop: 15
    },

    header: {
        marginTop: 30
    },

    headerText: {
        fontSize: 28,
        fontFamily: "InterBold",
        marginLeft: 15,
        marginBottom: 10
    },

    optionsOutContainer: {
        padding: 15,
        justifyContent: "center",
        alignItems: "center"
    },

    optionInContainer: {
        width: "98%",
        backgroundColor: "rgb(225,225,225)",
        borderRadius: 10,
        paddingTop: 10,
        paddingBottom: 40
    },

    optionsContainer: {
        height: 60,
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 10,
        flexDirection: "row",
        borderBottomWidth: 0.5
    },

    optionsText: {
        fontSize: 18,
        fontFamily: "InterNormal"
    },

    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Koyu arka plan
    },

    modalContent: {
        width: '80%', // Modal genişliği
        height: '40%', // Modal yüksekliği
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        justifyContent: "center",
        elevation: 5
    },

    modalTitle: {
        fontSize: 24,
        fontFamily: "InterBold",
        marginBottom: 20
    },

    themeOption: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        width: '100%',
        alignItems: 'center',
    },

    themeText: {
        fontSize: 18,
        fontFamily: "InterNormal"
    },

    closeButton: {
        marginTop: 20,
        padding: 12,
        backgroundColor: '#007BFF',
        borderRadius: 16,
        marginTop: 40,
        width: "80%",
        justifyContent: "center",
        alignItems: "center"
    },

    closeButtonText: {
        color: '#fff',
        fontFamily: "InterBold",
        fontSize: 16
    },

    deleteAllContainer: {
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 50,
        elevation: 5
    },

    deleteAllButton: {
        width: "70%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgb(242, 74, 56)",
        padding: 12,
        borderRadius: 15
    },

    deleteAllText: {
        fontFamily: "InterBold",
        color: "rgb(244, 244, 244)",
        fontSize: 18
    },

    headerModern: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        marginBottom: 18,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(120,120,120,0.08)',
    },

    headerTextModern: {
        fontSize: 32,
        fontFamily: 'InterBold',
        letterSpacing: 0.5
    },

    cardsContainer: {
        paddingHorizontal: 18,
        gap: 18,
        marginTop: 10,
        marginBottom: 30
    },

    card: {
        borderRadius: 18,
        padding: 18,
        marginBottom: 0,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 64
    },

    cardLight: {
        backgroundColor: '#f7f7f7',
    },

    cardDark: {
        backgroundColor: '#232323',
    },

    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
    },

    cardTitle: {
        fontSize: 18,
        fontFamily: 'InterBold',
    },

    cardBadge: {
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: '#e0e0e0',
        marginLeft: 10
    },

    cardBadgeLight: {
        backgroundColor: '#e0e0e0',
    },

    cardBadgeDark: {
        backgroundColor: '#444',
    },

    cardBadgeActive: {
        backgroundColor: '#ffd700',
    },

    cardBadgeText: {
        fontSize: 15,
        fontFamily: 'InterBold',
    },

    deleteAllContainerModern: {
        width: '100%',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20
    },

    deleteAllButtonModern: {
        width: '80%',
        backgroundColor: 'rgb(242, 74, 56)',
        padding: 18,
        borderRadius: 18,
        alignItems: 'center',
        shadowColor: 'rgb(242, 74, 56)',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 4
    },

    deleteAllTextModern: {
        fontFamily: 'InterBold',
        color: '#fff',
        fontSize: 19,
        letterSpacing: 0.5
    },

    modalContainerModern: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
    },

    modalContentModern: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8
    },

    modalTitleModern: {
        fontSize: 26,
        fontFamily: 'InterBold',
        marginBottom: 24
    },

    themeOptionModern: {
        padding: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },

    themeTextModern: {
        fontSize: 18,
        fontFamily: 'InterNormal',
    },

    closeButtonModern: {
        marginTop: 18,
        padding: 12,
        backgroundColor: '#007BFF',
        borderRadius: 16,
        width: '80%',
        justifyContent: 'center',
        alignItems: 'center'
    },

    closeButtonTextModern: {
        color: '#fff',
        fontFamily: 'InterBold',
        fontSize: 16
    },
})