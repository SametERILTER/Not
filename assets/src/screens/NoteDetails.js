import { ScrollView, Alert, StyleSheet, Text, TouchableOpacity, View, TextInput, BackHandler, Modal, Image, Share, ToastAndroid, StatusBar } from 'react-native';
import { React, useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from "./../../color";
import Icon from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

const NoteDetails = ({ navigation, route }) => {
    const [colorModalVisible, setColorModalVisible] = useState(false);
    const [menuModalVisible, setMenuModalVisible] = useState(false);
    const colorPalette = [
        'rgb(235, 28, 28)',
        'rgb(27, 88, 220)',
        'rgb(18, 200, 21)',
        'rgb(238, 238, 56)',
        'rgb(20, 20, 20)'
    ];
    const { note: initialNote } = route.params;
    const [editedNote, setEditedNote] = useState(initialNote);
    const [originalNote] = useState(initialNote);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedColor, setSelectedColor] = useState(initialNote.color);
    const [isDarkTheme, setIsDarkTheme] = useState("light"); // Varsayılan tema açık
    const [reminderModalVisible, setReminderModalVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedReminderDate, setSelectedReminderDate] = useState(new Date());
    const [selectedReminderTime, setSelectedReminderTime] = useState(new Date());
    const [isReminder, setIsReminder] = useState(false);
    const [reminderDate, setReminderDate] = useState("");
    const [noteTitle, setNoteTitle] = useState("");
    const [noteContent, setNoteContent] = useState("");

    const isReminderRef = useRef(false);
    const remiderDateRef = useRef(new Date());
    const remiderTimeRef = useRef(new Date());

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

        setReminderModalVisible(true);
    }

    const confirmReminder = async () => {
        setIsReminder(true);
        isReminderRef.current = true;
        setReminderModalVisible(false);
        setNotification();

        //console.log("isReminder ayarlandi");

        // Hatırlatıcı tarih ve saatini not nesnesine ekle
        const updatedNote = { ...editedNote, reminderDate: remiderDateRef.current, reminderTime: remiderTimeRef.current };
        setEditedNote(updatedNote); // Güncellenmiş notu state'e kaydet

        // Notu AsyncStorage'a kaydet
        await saveChanges(false); // Navigasyona geri dönmeden kaydet

    }

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
                    title: editedNote.title || 'Not Hatırlatıcı',
                    body: editedNote.content || 'Notunuz için hatırlatma zamanı!',
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

    const selectColor = async (color) => {
        setSelectedColor(color);
        setColorModalVisible(false);
    };

    const clearColorSelect = () => {
        setSelectedColor("");
        setColorModalVisible(false);
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

    const handleColorSelect = async (color) => {
        setSelectedColor(color);
        try {
            const updatedNote = { ...editedNote, color };
            setEditedNote(updatedNote);

            const storedNotes = await AsyncStorage.getItem('notes');
            const notes = storedNotes ? JSON.parse(storedNotes) : [];
            const noteIndex = notes.findIndex(n => n.id === updatedNote.id);

            if (noteIndex === -1) throw new Error('Not bulunamadı');

            const updatedNotes = [...notes];
            updatedNotes[noteIndex] = updatedNote;
            await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
        } catch (error) {
            console.log(error);
        } finally {
            setColorModalVisible(false);
        }
    };

    const formatDateNote = (dateString) => {
        const monthsTR = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];

        const [day, month, year] = dateString.split('.').map(Number);
        if (month < 1 || month > 12) {
            return 'Geçersiz Tarih';
        }

        return `${day} ${monthsTR[month - 1]} ${year}`;
    };

    const hasChanges = useCallback(() => {
        return JSON.stringify(editedNote) !== JSON.stringify(originalNote);
    }, [editedNote, originalNote]);

    const saveChanges = async (shouldNavigateBack = true) => {
        setIsSaving(true);
        try {
            const storedNotes = await AsyncStorage.getItem('notes');
            const notes = storedNotes ? JSON.parse(storedNotes) : [];
            const noteIndex = notes.findIndex(n => n.id === editedNote.id);

            if (noteIndex === -1) throw new Error('Not bulunamadı');

            const updatedNotes = [...notes];
            updatedNotes[noteIndex] = { ...editedNote };
            await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));

            if (shouldNavigateBack) {
                navigation.goBack();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };


    const handleBackPress = useCallback(() => {
        console.log("geri tuşuna basıldı");
        if (hasChanges()) {
            saveChanges();
        } else {
            navigation.goBack();
        }
        return true;
    }, [hasChanges, navigation, saveChanges]);

    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', handleBackPress);
        return () => BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    }, [handleBackPress]);

    useFocusEffect(
        useCallback(() => {
            return () => {
                if (hasChanges()) {
                    saveChanges(false);
                }
            };
        }, [hasChanges])
    );

    const shareNote = async () => {
        try {
            await Share.share({
                message: `${editedNote.title}\n\n${editedNote.content}`,
            });
        } catch (error) {
            console.log(error.message);
        }
    };

    const toggleMenuModal = () => {
        setMenuModalVisible(!menuModalVisible);
    };

    const handleMenuOption = (option) => {
        setMenuModalVisible(false)
        console.log(`Seçilen Menü Öğesi: ${option}`);
        toggleMenuModal();
        if (option === 'Hatırlatıcı') {
            openReminderModal();
        } else if (option === 'Paylaş') {
            shareNote(); // Notu paylaş
        }
    };

    const toggleStarred = () => {
        const updatedNote = { ...editedNote, isStarred: !editedNote.isStarred };
        setEditedNote(updatedNote);
    };

    return (
        <View style={[styles.container,
            { backgroundColor: isDarkTheme === "light" ? colors.light.mainBackground : colors.dark.mainBackground }
        ]}>
            <StatusBar
                translucent={false}
                backgroundColor={isDarkTheme === "light" ? colors.light.mainBackground : colors.dark.mainBackground}
                barStyle={isDarkTheme === "light" ? "dark-content" : "light-content"}
            />

            <LinearGradient
                colors={selectedColor === "white" ? ['transparent', 'transparent'] : (isDarkTheme === "light" ? [selectedColor, 'transparent'] : [selectedColor, 'transparent'])}
                style={{
                    position: 'absolute',
                    top: -58,
                    left: 0,
                    right: 0,
                    height: 100,
                    zIndex: 0,
                }}
            />

            <View style={[styles.header,
                {
                    borderBottomWidth: 0,
                    borderBottomColor: selectedColor === "white" ? "rgb(120,120,120)" : selectedColor
                }
            ]}>
                <TouchableOpacity onPress={() => handleBackPress()}>
                    <Icon name="angle-left" size={26}
                        color={isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder} />
                </TouchableOpacity>

                <View style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                }}>
                    <TouchableOpacity style={[styles.colorButton,
                    { backgroundColor: selectedColor }]} onPress={() => setColorModalVisible(true)}>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={toggleStarred}>
                        <Icon name={editedNote.isStarred ? "star" : "star-o"} size={26} color={editedNote.isStarred ? "gold" : "gray"} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.reminderButton}
                        onPress={toggleMenuModal}
                    >
                        <Icon name="ellipsis-v" size={18}
                            color={isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder} />
                    </TouchableOpacity>

                </View>

            </View>

            <Modal
                visible={menuModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={toggleMenuModal}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(10,10,10,0.8)" }}>
                    <View style={[styles.menuModalContainer,
                    { backgroundColor: isDarkTheme === "light" ? 'white' : 'rgba(30, 30, 30, 0.95)' }
                    ]}>
                        <View style={[styles.menu, { backgroundColor: isDarkTheme === "light" ? 'white' : 'rgba(30, 30, 30, 0.9)' }]}>
                            <TouchableOpacity onPress={() => handleMenuOption('Hatırlatıcı')}>
                                <View style={styles.menuItem}>
                                    <Icon name="bell" size={18} color={isDarkTheme === "light" ? "black" : "white"} />
                                    <Text style={[styles.menuItemText, { color: isDarkTheme === "light" ? "black" : "white" }]}>Hatırlatıcı</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleMenuOption('Paylaş')}>
                                <View style={styles.menuItem}>
                                    <Icon name="send" size={18} color={isDarkTheme === "light" ? "black" : "white"} />
                                    <Text style={[styles.menuItemText, { color: isDarkTheme === "light" ? "black" : "white" }]}>Paylaş</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ScrollView style={styles.inputContainer}>

                <TextInput
                    style={[styles.noteTitleInput,
                    { color: isDarkTheme === "light" ? colors.light.text : colors.dark.text }
                    ]}
                    value={editedNote.title}
                    onChangeText={text => setEditedNote({ ...editedNote, title: text })}
                    placeholder="Başlık"
                    selectionColor={"rgb(193, 186, 6)"}
                    placeholderTextColor={isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder}
                    multiline
                />

                <View style={{
                    flexDirection: "row",
                    justifyContent: "left",
                    alignItems: "center",
                }}>

                    <Text style={styles.noteDateText}>{formatDateNote(editedNote.date)}</Text>

                    {editedNote.reminderDate && (
                        <TouchableOpacity style={styles.reminderContainer} onPress={openReminderModal}>
                            <Icon name="bell" size={16}
                                color={isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder} />
                            <Text style={styles.reminderDate}>
                                {new Date(editedNote.reminderDate).toLocaleString('tr-TR', {
                                    day: '2-digit',
                                    month: 'short',
                                })}
                                {' '}
                                {(() => {
                                    const reminderTime = editedNote.reminderTime; // Örnek: "1970-01-01T07:46:00"
                                    const date = new Date(reminderTime); // Tarih nesnesi oluştur
                                    const hours = date.getHours(); // Saat
                                    const minutes = date.getMinutes(); // Dakika
                                    // Saat ve dakikayı formatla
                                    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                                })()}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TextInput
                    style={[styles.contentInput,
                    { color: isDarkTheme === "light" ? colors.light.text : colors.dark.text }
                    ]}
                    multiline
                    value={editedNote.content}
                    onChangeText={text => setEditedNote({ ...editedNote, content: text })}
                    placeholder="Notunuzu buraya yazın..."
                    selectionColor={"rgb(193, 186, 6)"}
                    scrollEnabled={false}
                />

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
                                        { backgroundColor: color, width: 190, height: 42, borderRadius: 6, margin: 6, marginBottom: 0 },
                                        selectedColor === color && {
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
                                    onPress={() => handleColorSelect(color)}
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
}

export default NoteDetails

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "rgb(255,255,255)",
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

    noteTitleInput: {
        minHeight: 64,
        width: "88%",
        fontSize: 32,
        fontFamily: "InterBold",
        paddingLeft: 5,
    },

    reminderContainer: {
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        marginLeft: 15,
        bottom: 5
    },

    reminderDate: {
        color: "rgb(160,160,160)",
        fontWeight: 600,
        fontSize: 15,
        marginLeft: 8
    },

    colorButton: {
        width: 26,
        height: 26,
        borderRadius: 10,
        marginHorizontal: 10,
        borderWidth: 2.4,
        borderColor: "rgb(80, 80, 80)"
    },

    reminderButton: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row"
    },

    inputContainer: {
        paddingHorizontal: 15,
    },

    noteDateText: {
        fontSize: 13,
        fontFamily: "InterNormal",
        color: "rgb(80, 80, 80)",
        marginBottom: 10,
        marginLeft: 5
    },

    contentInput: {
        fontSize: 18,
        paddingLeft: 5,
        marginBottom: 40,
        lineHeight: 40,
        fontFamily: "InterNormal",
        color: "rgb(20,20,20)"
    },

    modalContainer: {
        padding: 20,
        margin: 20,
        borderRadius: 15,
        elevation: 20
    },

    menuModalContainer: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: '80%',
        borderRadius: 8,
        padding: 15,
    },

    menu: {
        // Menü içeriği için stil
    },

    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        fontSize: 16,
        color: 'black',
    },

    menuItemText: {
        marginLeft: 12, // İkon ile metin arasında boşluk
        fontFamily: "InterNormal",
        fontSize: 16
    },

    colorPalette: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 50,
        gap: 18
    },

    colorOption: {
        width: 190,
        height: 42,
        borderRadius: 6,
        marginBottom: 0,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
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
        fontFamily: "InterBold",
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
        fontFamily: "InterBold",
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