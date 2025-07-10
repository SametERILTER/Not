import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, BackHandler, Modal, ToastAndroid, Image, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { React, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import colors from "./../../color";
import Icon from 'react-native-vector-icons/FontAwesome';

const AddNote = ({ navigation }) => {
    const [notes, setNotes] = useState([]);
    const [noteTitle, setNoteTitle] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [inputHeight, setInputHeight] = useState(50);
    const [selectedColor, setSelectedColor] = useState("");
    const [colorModalVisible, setColorModalVisible] = useState(false);
    const [reminderModalVisible, setReminderModalVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedReminderDate, setSelectedReminderDate] = useState(new Date());
    const [selectedReminderTime, setSelectedReminderTime] = useState(new Date());
    const [isReminder, setIsReminder] = useState(false);
    const [reminderDate, setReminderDate] = useState("");
    const [isDarkTheme, setIsDarkTheme] = useState("light"); // Varsayılan tema açık
    const [isStarred, setIsStarred] = useState(false); // Yıldız durumu

    const colorRef = useRef("white");
    const isReminderRef = useRef(false);
    const remiderDateRef = useRef(new Date());
    const remiderTimeRef = useRef(new Date());
    const isStarredRef = useRef(false);

    const noteInputRef = useRef(null); // TextInput için referans
    //const route = useRoute();

    const handleStarred = () => {
        isStarredRef.current = !isStarredRef.current;
        setIsStarred(!isStarred);
        console.log(isStarredRef.current);
        
    }

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

    useEffect(() => {
        // Bileşen yüklendiğinde klavyeyi aç
        const timer = setTimeout(() => {
            if (noteInputRef.current) {
                noteInputRef.current.focus();
            }
        }, 100); // 100ms gecikme genellikle yeterlidir
    }, []); // Boş bağımlılık dizisi ile sadece bir kez çalışır

    const colorPalette = [
        "rgb(235, 28, 28)", // Kırmızı
        "rgb(27, 88, 220)", // Mavi
        "rgb(18, 200, 21)", // Açık Mavi
        "rgb(238, 238, 56)", // Yeşil
        "rgb(20, 20, 20)"  // Sarı
    ];

    const selectColor = (color) => {
        setColorModalVisible(false);
        colorRef.current = color;

    };

    const clearColorSelect = () => {
        setColorModalVisible(false);
        colorRef.current = "";
    }

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

    const openReminderModal = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        console.log(status);

        if (status !== 'granted') {
            const { status: newStatus } = await Notifications.requestPermissionsAsync();
            if (newStatus !== 'granted') {
                Alert.alert("Bildirim İzni", "Hatırlatıcı kurmak için bildirim izni vermelisiniz.");
                return;
            }
        }

        if (!noteContent) {
            Alert.alert("Uyarı", "Lütfen hatırlatıcı kurmadan önce bir not girin");
            return;
        } else {
            setReminderModalVisible(true);
        }
    }

    const confirmReminder = async () => {
        setIsReminder(true);
        isReminderRef.current = true;
        setReminderModalVisible(false);

        //console.log("isReminder ayarlandi");

    }

    const setReminder = async () => {
        if (noteContent.trim()) {
            setNotification();
            const newNote = {
                title: noteTitle,
                content: noteContent,
                date: new Date().toLocaleDateString(),
                color: colorRef.current || "white",
                id: Date.now().toString(),
                reminderDate: remiderDateRef.current, // Hatırlatıcı tarihi (varsa)
                reminderTime: remiderTimeRef.current,
                isStarred: isStarred // Yıldız durumu
            };

            const updatedNotes = [newNote, ...notes];
            await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));

            setNotes(updatedNotes);
            setInputHeight(40); // Giriş alanı yüksekliğini sıfırla
        }


    };

    const handleDateChange = (event, date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedReminderDate(date);
            remiderDateRef.current = date;
        }
    };

    // Saat seçim handler'ı
    const handleTimeChange = (event, selectedTime) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const newDateTime = new Date(isReminderRef.current);
            newDateTime.setHours(selectedTime.getHours());
            newDateTime.setMinutes(selectedTime.getMinutes());
            setSelectedReminderTime(newDateTime);
            remiderTimeRef.current = newDateTime;
        }
    };


    const goAddReminder = () => {
        if (noteContent) {
            navigation.navigate('AddReminder', {
                note: { title: noteTitle, content: noteContent },
            });
        }

        else {
            Alert.alert("Uyarı", "Lütfen önce bir not giriniz.");
        }
    }


    useEffect(() => {
        const loadNotes = async () => {
            try {
                const storedNotes = await AsyncStorage.getItem('notes');
                if (storedNotes) {
                    setNotes(JSON.parse(storedNotes));
                } else {
                    console.log("No notes found in AsyncStorage.");
                }
            } catch (error) {
                console.error(error);
            }
        };

        loadNotes();
    }, []);



    const handleBackPress = () => {
        //console.log("geri basıldı");

        saveNote().then(() => {
            navigation.navigate("MainScreen");
            return true;
        });
    };

    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            handleBackPress,
        );
        return () => backHandler.remove();
    }, [noteContent, navigation]); // Tüm bağımlılıkları ekleyin



    const saveNote = async () => {
        console.log("isReminder: ", isReminderRef);

        if (isReminderRef.current) {
            console.log("Bildirimli hatirlatici ayarlaniyor...");
            setReminder();
        }

        else {
            if (noteContent.trim()) {
                console.log("Bildirimsiz hatirlatici ayarlaniyor...");

                const newNote = {
                    title: noteTitle,
                    content: noteContent,
                    date: new Date().toLocaleDateString(),
                    color: colorRef.current || "white",
                    id: Date.now().toString(),
                    reminderDate: null, // Hatırlatıcı tarihi (varsa)
                    isStarred: isStarredRef.current // Yıldız durumu
                };


                const updatedNotes = [newNote, ...notes];
                await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));

                setNotes(updatedNotes);
                setInputHeight(40); // Giriş alanı yüksekliğini sıfırla
            }
        }

    };

    const setNotification = async () => {
        try {
            console.log("reminderTimeRef: ", remiderTimeRef.current);

            // Tarihi ve saati birleştir
            let targetDate = new Date(
                remiderDateRef.current.getFullYear(),
                remiderDateRef.current.getMonth(),
                remiderDateRef.current.getDate(),
                remiderTimeRef.current.getHours(),
                remiderTimeRef.current.getMinutes(),
                0
            );

            console.log("targetDate: ", targetDate);


            // Şimdiki zaman
            const now = new Date();

            // Tarih kontrolü
            if (targetDate <= now) {
                Alert.alert('Hata', 'Geçmiş bir tarih için bildirim ayarlanamaz');
                return;
            }

            // Zaman farkını hesapla (millisaniye)
            const timeInMs = targetDate.getTime() - now.getTime();
            // Saniye cinsinden
            const timeInSeconds = Math.floor(timeInMs / 1000);

            console.log("BİLDİRİM ", timeInSeconds, " SANİYE SONRA GÖSTERİLECEKTİR");


            //console.log('Hedef tarih:', targetDate.toLocaleString());
            //console.log('Şu anki zaman:', now.toLocaleString());
            //console.log('Zaman farkı (saniye):', timeInSeconds);

            // Önce mevcut bildirimleri temizle (isteğe bağlı)
            // await Notifications.cancelAllScheduledNotificationsAsync();

            // Bildirimi planla
            const identifier = await Notifications.scheduleNotificationAsync({
                content: {
                    title: noteTitle || 'Not Hatırlatıcı',
                    body: noteContent || 'Notunuz için hatırlatma zamanı!',
                    data: { noteId: Date.now().toString() },
                    android: {
                        channelId: 'reminders',
                        vibrate: [0, 250, 250, 250],
                    }
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: timeInSeconds,
                    repeats: false
                },
            });

            //console.log('Bildirimin ID\'si:', identifier);

            // Hatırlatıcıyı state'e kaydet
            setReminderDate(targetDate);

            // Kullanıcıya bildir
            ToastAndroid.show(
                `Hatırlatıcı ${targetDate.toLocaleString('tr-TR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                })} tarihine ayarlandı`,
                ToastAndroid.LONG
            );

            // Kontrol için planlanan bildirimleri listele
            const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
            //console.log('Planlanan bildirimler:', JSON.stringify(scheduledNotifications, null, 2));

        } catch (error) {
            console.error('Bildirim planlama hatası:', error);
            Alert.alert('Hata', 'Bildirim zamanlanamadı: ' + error.message);
        }
    }


    return (
        <View style={[styles.container,
        { backgroundColor: isDarkTheme === "light" ? colors.light.mainBackground : colors.dark.mainBackground }
        ]}>
            <StatusBar translucent={false} backgroundColor={isDarkTheme === "light" ? colors.light.mainBackground : colors.dark.mainBackground} barStyle={isDarkTheme === "light" ? "dark-content" : "light-content"} />

            <View style={styles.header}>

                <View style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center"
                }}>
                    <TouchableOpacity onPress={() => handleBackPress()}>
                        <Icon name="angle-left" size={28}
                            color={isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder} />
                    </TouchableOpacity>


                </View>



                <View style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center"
                }}>

                    <TouchableOpacity style={[styles.colorButton,
                    { backgroundColor: colorRef.current }]}
                        onPress={() => setColorModalVisible(true)}></TouchableOpacity>

                    <TouchableOpacity style={{marginRight: 10}}onPress={handleStarred}>
                        <Icon name={isStarred ? "star" : "star-o"} size={28} color={isStarredRef.current ? "gray" : "gray"} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.reminderButton,
                    {
                        backgroundColor: isDarkTheme === "light" ? colors.light.inputBackground : colors.dark.inputBackground
                    }
                    ]}
                        onPress={openReminderModal}>

                        <Text style={{
                            color: isDarkTheme === "light" ? colors.light.text : colors.dark.text,
                            marginRight: 5,
                            fontFamily: "InterNormal"
                        }}>Hatırlatıcı</Text>
                        <Icon name="bell" size={16}
                            color={isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder} />


                    </TouchableOpacity>

                </View>


            </View>

            <ScrollView style={styles.inputContainer}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                contentContainerStyle={{ flexGrow: 1 }}
            >

                <TextInput style={[styles.noteTitleInput,
                { color: isDarkTheme === "light" ? colors.light.text : colors.dark.text }
                ]}
                    placeholder='Başlık'
                    placeholderTextColor={isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder}
                    multiline
                    value={noteTitle}
                    selectionColor={"rgb(193, 186, 6)"}
                    onChangeText={text => setNoteTitle(text)}></TextInput>


                {isReminder && (
                    <View style={styles.reminderInfoContainer}>

                        <Image source={require("../icons/reminder.png")} style={{ marginRight: 5 }} />
                        <Text style={styles.reminderInfoText}>
                            {remiderDateRef.current.toLocaleDateString('tr-TR')} {formatTime(remiderTimeRef.current)}
                        </Text>
                    </View>
                )}

                <TextInput style={[styles.noteContentInput,
                { color: isDarkTheme === "light" ? colors.light.text : colors.dark.text }
                ]}
                    ref={noteInputRef}
                    placeholder='Yazmaya başlayın'
                    placeholderTextColor={isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder}
                    multiline
                    value={noteContent}
                    selectionColor={"rgb(193, 186, 6)"}
                    onChangeText={text => setNoteContent(text)}
                    scrollEnabled={false}></TextInput>

            </ScrollView>

            <Modal
                visible={colorModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setColorModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: isDarkTheme === "light" ? '#fff' : '#232323', borderRadius: 26, padding: 28, minWidth: 280, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24, elevation: 24, position: 'relative' }}>
                        {/* X Kapat ikonu */}
                        <TouchableOpacity onPress={() => setColorModalVisible(false)} style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, padding: 4 }}>
                            <Icon name="close" size={22} color={isDarkTheme === "light" ? '#222' : '#fff'} />
                        </TouchableOpacity>
                        <Text style={{ fontFamily: 'InterBold', fontSize: 18, marginBottom: 18, color: isDarkTheme === "light" ? '#222' : '#fff', alignSelf: 'flex-start' }}>Renk Seç</Text>
                        {/* Grid renkler */}
                        <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 18, marginBottom: 18 }}>
                            {colorPalette.map((color, idx) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color, margin: 6 },
                                        colorRef.current === color && {
                                            borderWidth: 3,
                                            borderColor: '#222',
                                            shadowColor: color,
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.4,
                                            shadowRadius: 8,
                                            elevation: 10,
                                            transform: [{ scale: 1.18 }],
                                        }
                                    ]}
                                    onPress={() => selectColor(color)}
                                />
                            ))}
                        </View>
                        {/* Temizle linki */}
                        <TouchableOpacity
                            style={{ marginBottom: 2, padding: 6, borderRadius: 8, alignItems: 'center' }}
                            onPress={() => clearColorSelect()}
                        >
                            <Text style={{ color: '#4A90E2', fontSize: 15, fontFamily: 'InterBold', textDecorationLine: 'underline' }}>Renk seçimini temizle</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={reminderModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setReminderModalVisible(false)}
            >
                <View style={[styles.reminderModalContainer]}>

                    <View style={styles.reminderModalInnerContainer}>

                        <View style={[styles.reminderModalInnerContentContainer,
                        { backgroundColor: isDarkTheme === "light" ? colors.light.inputBackground : colors.dark.inputBackground }
                        ]}>

                            <View style={styles.reminderModalHeader}>

                                <Text style={[styles.reminderModalHeaderText,
                                { color: isDarkTheme === "light" ? colors.light.text : colors.dark.text }
                                ]}>Hatırlatıcı ekle</Text>

                            </View>

                            <View style={styles.reminderModalButtonsContainer}>

                                <TouchableOpacity style={[styles.reminderDateButtons,
                                { backgroundColor: isDarkTheme === "light" ? colors.light.buttonBackground : colors.dark.buttonBackground }
                                ]}
                                    onPress={() => setShowDatePicker(true)}>
                                    <Text style={[styles.reminderDateText,
                                    { color: isDarkTheme === "light" ? colors.light.text : colors.dark.text }
                                    ]}>Tarih seçin</Text>
                                </TouchableOpacity>

                                <Text style={[styles.reminderDateText,
                                { color: isDarkTheme === "light" ? colors.light.text : colors.dark.text }
                                ]}>{formatDate(remiderDateRef.current)}</Text>


                            </View>

                            <View style={styles.reminderModalButtonsContainer}>

                                <TouchableOpacity style={[styles.reminderDateButtons,
                                { backgroundColor: isDarkTheme === "light" ? colors.light.buttonBackground : colors.dark.buttonBackground }
                                ]}
                                    onPress={() => setShowTimePicker(true)}>
                                    <Text style={[styles.reminderDateText,
                                    { color: isDarkTheme === "light" ? colors.light.text : colors.dark.text }
                                    ]}>Saat seçin</Text>
                                </TouchableOpacity>

                                <Text style={[styles.reminderDateText,
                                { color: isDarkTheme === "light" ? colors.light.text : colors.dark.text }
                                ]}>{formatTime(remiderTimeRef.current)}</Text>


                            </View>

                            <View style={styles.reminderModalButtonsContainer}>

                                <TouchableOpacity style={[styles.reminderConfirmButtons,
                                { backgroundColor: "rgb(220, 220, 220)" }
                                ]} onPress={() => setReminderModalVisible(false)}>
                                    <Text style={{
                                        fontSize: 18,
                                        fontFamily: "InterBold"
                                    }}>İptal</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.reminderConfirmButtons,
                                { backgroundColor: "rgb(36, 85, 232)" }
                                ]}
                                    onPress={confirmReminder}>
                                    <Text style={{
                                        fontSize: 18,
                                        fontFamily: "InterBold",
                                        color: "white"
                                    }}>Onayla</Text>
                                </TouchableOpacity>

                            </View>

                        </View>

                    </View>

                </View>

            </Modal>

            {showDatePicker && (
                <DateTimePicker
                    value={remiderDateRef.current}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                />
            )}

            {showTimePicker && (
                <DateTimePicker
                    value={remiderTimeRef.current}
                    mode="time"
                    display="clock"
                    onChange={handleTimeChange}
                    is24Hour={true}
                />
            )}

        </View>

    )
};

export default AddNote;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "rgb(252,252,252)",
        paddingTop: 10
    },

    header: {
        width: "100%",
        height: 56,
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 18,
    },

    colorButton: {
        width: 28,
        height: 28,
        borderRadius: 10,
        marginHorizontal: 10,
        borderWidth: 2.4,
        borderColor: "rgb(80, 80, 80)",
        marginRight: 15
    },

    reminderButton: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row"
    },

    inputContainer: {
        paddingHorizontal: 18
    },

    noteTitleInput: {
        minHeight: 64,
        width: "88%",
        fontSize: 32,
        fontFamily: "InterBold",
        paddingLeft: 5,
    },

    reminderInfoContainer: {
        justifyContent: "left",
        alignItems: "center",
        flexDirection: "row",
    },

    reminderInfoText: {
        color: "rgb(100,100,100)",
        fontWeight: 600
    },

    noteContentInput: {
        fontSize: 18,
        paddingLeft: 5,
        marginBottom: 40,
        lineHeight: 42,
        fontFamily: "InterNormal"
    },

    modalContainer: {
        backgroundColor: "rgb(250,250,250)",
        padding: 20,
        margin: 20,
        borderRadius: 15,
        elevation: 20
    },

    colorPalette: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 50
    },

    colorOption: {
        width: 190,
        height: 42,
        borderRadius: 6,
        marginBottom: 0
    },

    closeButton: {
        backgroundColor: "rgb(255, 200, 184)",
        justifyContent: "center",
        alignItems: "center",
        padding: 8,
        borderRadius: 15
    },

    closeButtonText: {
        fontSize: 18,
        fontWeight: 700,
        color: "rgb(224, 51, 0)"
    },

    clearColorSelectButton: {
        backgroundColor: "rgb(133, 133, 133)",
        justifyContent: "center",
        alignItems: "center",
        padding: 8,
        borderRadius: 15,
        marginBottom: 10
    },

    clearButtonText: {
        fontSize: 18,
        fontWeight: 700,
        color: "white"
    },

    reminderModalContainer: {
        flex: 1,
        backgroundColor: "rgba(80,80,80,0.1)"
    },

    reminderModalInnerContainer: {
        width: "100%",
        height: 480,
        justifyContent: "center",
        alignItems: "center",
        padding: 10,
        position: "absolute",
        bottom: 20
    },

    reminderModalInnerContentContainer: {
        backgroundColor: "rgb(246,246,246)",
        width: "98%",
        padding: 20,
        borderRadius: 20,
        elevation: 20
    },

    reminderModalHeader: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 40
    },

    reminderModalHeaderText: {
        fontSize: 24,
        fontFamily: "InterBold"
    },

    reminderModalButtonsContainer: {
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        marginBottom: 50
    },

    reminderDateButtons: {
        padding: 16,
        width: "40%",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12
    },

    reminderDateText: {
        fontSize: 18,
        fontFamily: "InterBold"
    },

    reminderConfirmButtons: {
        padding: 15,
        borderRadius: 20,
        width: "48%",
        justifyContent: "center",
        alignItems: "center"
    }
})