import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, FlatList, KeyboardAvoidingView, StatusBar, Keyboard, ToastAndroid, Modal, Animated, SafeAreaView } from 'react-native';
import { React, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import colors from "./../../color";
import Icon from 'react-native-vector-icons/FontAwesome';

const MainScreen = ({ navigation }) => {

  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isGridView, setIsGridView] = useState(false); // Izgara görünümü için state
  const [selectedColor, setSelectedColor] = useState("");
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState("light"); // Varsayılan tema açık
  const [headerOffset] = useState(new Animated.Value(0)); // Başlangıç değeri 0
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const animatedValues = useRef(Array(notes.length).fill(0).map(() => new Animated.Value(0))).current;
  const isKeyboardVisible = useRef(false);
  const searchInputRef = useRef(null);
  const [gradientVisible, setGradientVisible] = useState(false); // Gradient görünürlüğü için state
  const [showStarredOnly, setShowStarredOnly] = useState(false); // Yıldızlı notları gösterme durumu

  useEffect(() => {
    // Uygulama açıldığında tema ayarını AsyncStorage'dan çek
    const loadThemeSetting = async () => {
      const storedThemeSetting = await AsyncStorage.getItem('themeSetting');
      console.log("Tema depolama: ", storedThemeSetting);

      if (storedThemeSetting) {
        setIsDarkTheme(JSON.parse(storedThemeSetting));
        console.log("Uygulama teması: ", isDarkTheme);

      }
    };

    loadThemeSetting();
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

  const toggleView = async () => {
    const newViewSetting = !isGridView;
    setIsGridView(newViewSetting);
    await AsyncStorage.setItem('viewSetting', JSON.stringify(newViewSetting)); // Yeni ayarı kaydet
  }


  const colorPalette = [
    "rgb(235, 28, 28)", // Kırmızı
    "rgb(27, 88, 220)", // Mavi
    "rgb(18, 200, 21)", // Açık Mavi
    "rgb(238, 238, 56)", // Yeşil
    "rgb(20, 20, 20)"  // Sarı
  ];

  const selectColor = (color) => {
    setSelectedColor(color);
    setColorModalVisible(false);
  };

  const clearColorSelect = () => {
    setSelectedColor("");
    setColorModalVisible(false);
  }

  const filteredNotes = notes.filter(note => {
    // Eğer sadece yıldızlı notları göstermek istiyorsak
    if (showStarredOnly) {
      return note.isStarred; // Sadece yıldızlı notları döndür
    }

    // Eğer hiçbir arama kelimesi yoksa ve renk seçili değilse, tüm notları göster
    if (!searchQuery && !selectedColor) {
      return true;
    }

    // Arama sorgusuna göre filtrele
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());

    // Renk seçimine göre filtrele
    const matchesColor = !selectedColor || note.color === selectedColor;

    // Hem arama hem de renk seçimine göre filtrele
    return matchesSearch && matchesColor;
  });

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync('black');
    NavigationBar.setVisibilityAsync('visible');
    NavigationBar.setBehaviorAsync('inset-touch');
  }, []);


  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        isKeyboardVisible.current = true;
        handleFocus(); // Klavye açıldığında yukarı kaydır
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        isKeyboardVisible.current = false;
        handleBlur(); // Klavye kapandığında geri kaydır
        if (searchInputRef.current) {
          searchInputRef.current.blur();
        }
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Arama sonuçlarını filtrele


  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  const formatDate = (dateString) => {
    const monthsTR = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    // Tarihi "MM/DD/YYYY" formatından parse et
    const [day, month, year] = dateString.split('.').map(Number);

    // Ay indeksi kontrolü (JavaScript'te aylar 0-11 arası)
    if (month < 1 || month > 12) {
      return 'Geçersiz Tarih';
    }

    return `${day} ${monthsTR[month - 1]} ${year}`;
  };

  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem('notes');

      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const goAddNote = () => {
    setSearchQuery("");
    setSelectedColor("");
    navigation.navigate('AddNote');
  };

  const goNoteDetails = (item) => {
    setSearchQuery("");
    setSelectedColor("");
    navigation.navigate('NoteDetails', { note: item })
  }

  const saveNote = async (note) => {
    try {
      const updatedNotes = [note, ...notes];
      await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      console.error(error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log("sayfaya geri döndü");

      // Make sure animatedValues array has the right length
      if (animatedValues.length !== notes.length) {
        // Resize the array if needed
        while (animatedValues.length < notes.length) {
          animatedValues.push(new Animated.Value(0));
        }
        // Trim extra values if needed
        if (animatedValues.length > notes.length) {
          animatedValues.length = notes.length;
        }
      }

      // Start animations
      notes.forEach((_, index) => {
        // Reset the value before animating
        animatedValues[index].setValue(0);
        Animated.timing(animatedValues[index], {
          toValue: 1,
          duration: 300,
          delay: index * 70,
          useNativeDriver: true
        }).start();
      });
    }, [notes])
  );

  useEffect(() => {
    loadNotes();
  }, []);


  const getTitleFromContent = (content) => {
    const trimmedContent = content.trim();
    const words = trimmedContent.split(/\s+/);

    // Tek kelime durumu
    if (words.length === 1) {
      return trimmedContent.substring(0, 20);
    }

    // İki veya daha fazla kelime
    return words[0];
  };


  const deleteNote = (noteId) => {
    Alert.alert(
      'Notu Sil',
      'Bu notu silmek istediğinize emin misiniz?',
      [
        {
          text: 'Vazgeç',
          style: 'cancel',
        },
        {
          text: 'Sil',
          onPress: async () => {
            try {
              const updatedNotes = notes.filter(note => note.id !== noteId);
              await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
              setNotes(updatedNotes);
              ToastAndroid.show("Not silindi", ToastAndroid.SHORT);
            } catch (error) {
              console.log(error);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };


  const renderGridItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        onPress={() => goNoteDetails(item)}
        style={[styles.gridItem, {
          borderTopColor: item.color,
          borderTopWidth: 8,
          backgroundColor: isDarkTheme === "light" ? colors.light.noteItemBackground : colors.dark.noteItemBackground,
          transform: [{
            translateY: animatedValues[index] ? animatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0]
            }) : 0
          }]
        }]}
      >
        <View style={styles.gridItemContent}>
          <View style={{
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
          }}>
            <Text style={[styles.noteTitle,
            {
              color: isDarkTheme === "light" ? colors.light.text : colors.dark.text,
              bottom: item.isStarred ? 8 : 0
            }
            ]}>
              {(item.title || getTitleFromContent(item.content)).length > 10
                ? `${(item.title || getTitleFromContent(item.content)).substring(0, 10)}...`
                : (item.title || getTitleFromContent(item.content))}
            </Text>

            <View style={{
              justifyContent: "center",
              alignItems: "center"
            }}>
              <TouchableOpacity style={{
                width: 30, height: 30,
                justifyContent: "center", alignItems: "center", bottom: 5
              }} onPress={() => deleteNote(item.id)}>
                <Icon name="trash" size={18}
                  color={isDarkTheme === "light" ? colors.light.textSeconder : "rgb(247, 155, 162)"} />
              </TouchableOpacity>

              {item.isStarred && (
                <Icon name="star" size={18} color="gold" />
              )}
            </View>
          </View>


          <Text style={[styles.noteContent,
          { color: isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder }
          ]} numberOfLines={7}>
            {item.content.length > 110
              ? `${item.content.substring(0, 110)}...`
              : item.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item, index }) => {
    return (
      <TouchableOpacity onPress={() => goNoteDetails(item)}>
        <Animated.View style={[
          styles.noteItem,
          {
            opacity: animatedValues[index] ? animatedValues[index] : 1,
            transform: [{
              translateY: animatedValues[index] ? animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              }) : 0
            }],
            borderLeftWidth: 8,
            borderLeftColor: item.color,
            backgroundColor: isDarkTheme === "light" ? colors.light.noteItemBackground : colors.dark.noteItemBackground
          }
        ]}>
          <View style={styles.noteItemTitleContainer}>
            <Text style={[styles.noteTitle,
            { color: isDarkTheme === "light" ? colors.light.text : colors.dark.text }
            ]}>
              {(item.title || getTitleFromContent(item.content)).length > 18
                ? `${(item.title || getTitleFromContent(item.content)).substring(0, 18)}...`
                : (item.title || getTitleFromContent(item.content))}
            </Text>

            <TouchableOpacity style={{
              width: 30, height: 30,
              justifyContent: "center", alignItems: "center"
            }} onPress={() => deleteNote(item.id)}>
              <Icon name="trash" size={18}
                color={isDarkTheme === "light" ? colors.light.textSeconder : "rgb(247, 155, 162)"} />
            </TouchableOpacity>
          </View>

          {item.isStarred && (
            <Icon name="star" size={18} color="gold" />
          )}

          <Text style={[styles.noteContent,
          { color: isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder }
          ]} numberOfLines={1}>
            {item.content.length > 20
              ? `${item.content.substring(0, 100)}...`
              : item.content}
          </Text>

          <Text style={[styles.noteDate,
          { color: isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder }
          ]}>{formatDate(item.date)}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const handleFocus = () => {
    Animated.parallel([
      Animated.timing(headerOffset, {
        toValue: -68,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBlur = () => {
    Animated.parallel([
      Animated.timing(headerOffset, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setGradientVisible(offsetY > 5); // Eğer offsetY 0'dan büyükse gradient görünür
  };

  return (
    <>
      <StatusBar
        translucent={false}
        backgroundColor={isDarkTheme === "light" ? colors.light.mainBackground : colors.dark.mainBackground}
        barStyle={isDarkTheme === "light" ? "dark-content" : "light-content"}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkTheme === "light" ? colors.light.mainBackground : colors.dark.mainBackground }]}>
        <View style={[styles.container,
        { backgroundColor: isDarkTheme === "light" ? colors.light.mainBackground : colors.dark.mainBackground }
        ]}>

          <Animated.View style={{ transform: [{ translateY: headerOffset }] }}>
            <Animated.View style={[styles.header, { opacity: headerOpacity }]}>

              <Text style={[styles.headerText,
              { color: selectedColor ? selectedColor : (isDarkTheme === "light" ? colors.light.text : colors.dark.text) }
              ]}>Notlar</Text>

              <View style={{
                flexDirection: "row",
                width: 150, justifyContent: "space-between",
                alignItems: "center"
              }}>

                <TouchableOpacity style={styles.colorButton}
                  onPress={() => setColorModalVisible(true)}>
                  <View style={styles.colorGrid}>
                    <View style={[styles.colorBox, { backgroundColor: 'rgb(233, 89, 89)' }]} />
                    <View style={[styles.colorBox, { backgroundColor: 'rgb(82, 133, 245)' }]} />
                    <View style={[styles.colorBox, { backgroundColor: 'rgb(81, 243, 83)' }]} />
                    <View style={[styles.colorBox, { backgroundColor: 'rgb(238, 238, 56)' }]} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.headerSettingsButton,

                  ]}
                  onPress={() => toggleView()}
                >

                  <Icon name="table" size={28}
                    color={isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder} />

                </TouchableOpacity>

                <TouchableOpacity style={[styles.headerSettingsButton,

                ]}
                  onPress={() => navigation.navigate("Settings")}>

                  <Icon name="ellipsis-v" size={28}
                    color={isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder} />

                </TouchableOpacity>

              </View>

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


            </Animated.View>

          </Animated.View>

          {gradientVisible && ( // Gradient yalnızca görünürse render edilir
            <LinearGradient
              colors={isDarkTheme === "light" ? ['rgba(50,50,50,0.08)', 'transparent'] : ['rgba(5,5,5,0.8)', 'transparent']}
              style={{
                position: 'absolute',
                top: 68,
                left: 0,
                right: 0,
                height: 20,
                zIndex: 5,
              }}
            />
          )}



          <View style={{ flex: 1, position: "relative" }}>


            {notes.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={[styles.emptyStateText,
                { color: isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder }
                ]}>Henüz not eklenmedi</Text>
              </View>
            ) : isGridView ? (
              <Animated.View style={[{ transform: [{ translateY: headerOffset }] },
              { justifyContent: "center", alignItems: "center" }]}>
                <FlatList
                  data={filteredNotes}
                  renderItem={renderGridItem}
                  keyExtractor={(item, index) => index.toString()}
                  contentContainerStyle={styles.gridFlatList}
                  numColumns={2}
                  key="grid"
                  onScroll={handleScroll} // Scroll olayını dinle
                  ListHeaderComponent={
                    <View style={[styles.searchInputContainer,
                    { width: "105%" }
                    ]}>

                      <View style={[styles.searchInputInnerContainer,
                      { backgroundColor: isDarkTheme === "light" ? colors.light.inputBackground : colors.dark.inputBackground }
                      ]}>

                        <Icon name="search" size={18}
                          color={isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder} />

                        <TextInput style={[styles.searchInput,
                        { color: isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder }
                        ]}
                          placeholder='Notlarda arayın...'
                          placeholderTextColor={"rgb(120,120,120)"}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          onFocus={handleFocus} // Animasyonu başlat
                          onBlur={handleBlur} // Animasyonu geri al
                          ref={searchInputRef}
                        />

                        <TouchableOpacity onPress={() => setShowStarredOnly(!showStarredOnly)}>
                          <Icon name={showStarredOnly ? "star" : "star-o"} size={24} color={showStarredOnly ? "rgb(227, 203, 95)" : "gray"} />
                        </TouchableOpacity>

                      </View>

                      <View style={{ width: "100%", justifyContent: "center", alignItems: "center" }}>
                      </View>

                    </View>
                  }
                />
              </Animated.View>
            ) : (
              <Animated.View style={{ transform: [{ translateY: headerOffset }] }}>
                <FlatList
                  data={filteredNotes}
                  renderItem={renderItem}
                  keyExtractor={(item, index) => index.toString()}
                  style={styles.flatList}
                  contentContainerStyle={{ paddingBottom: isKeyboardVisible.current ? 0 : 100 }}
                  key="list"
                  onScroll={handleScroll} // Scroll olayını dinle
                  ListHeaderComponent={
                    <View style={styles.searchInputContainer}>

                      <View style={[styles.searchInputInnerContainer,
                      { backgroundColor: isDarkTheme === "light" ? colors.light.inputBackground : colors.dark.inputBackground }
                      ]}>

                        <Icon name="search" size={18}
                          color={isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder} />

                        <TextInput style={[styles.searchInput,
                        { color: isDarkTheme === "light" ? colors.light.textSeconder : colors.dark.textSeconder }
                        ]}
                          placeholder='Notlarda arayın...'
                          placeholderTextColor={"rgb(120,120,120)"}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          onFocus={handleFocus} // Animasyonu başlat
                          onBlur={handleBlur} // Animasyonu geri al
                          ref={searchInputRef}
                        />

                        <TouchableOpacity onPress={() => setShowStarredOnly(!showStarredOnly)}>
                          <Icon name={showStarredOnly ? "star" : "star-o"} size={24} color={showStarredOnly ? "rgb(227, 203, 95)" : "gray"} />
                        </TouchableOpacity>

                      </View>

                      <View style={{ width: "100%", justifyContent: "center", alignItems: "center" }}>
                      </View>

                    </View>
                  }
                />
              </Animated.View>
            )}

          </View>

          <LinearGradient
            colors={['transparent', 'rgba(3, 3, 3, 0.6)']}
            style={{
              position: 'absolute',
              bottom: -24,
              left: 0,
              right: 0,
              height: 120,
              zIndex: 1,
            }}
          />


          {!keyboardVisible && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.noteAddButton} onPress={goAddNote}>
                <Icon name="plus" size={25} color={"rgb(240,240,240)"} />
              </TouchableOpacity>
            </View>
          )}

        </View>
      </SafeAreaView>
    </>
  )
}

export default MainScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(244,244,244)",
    paddingTop: 10
  },

  header: {
    width: "100%",
    height: 58,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 0
  },

  headerText: {
    fontSize: 28,
    fontFamily: "InterNormal"
  },

  headerSettingsButton: {
    width: 42,
    height: 42,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderColor: "rgb(80, 80, 80)",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    bottom: 2
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 24, // 2 sütun için genişlik
    height: 24, // 2 satır için yükseklik
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorBox: {
    width: '46%', // İki sütun için her bir kutunun genişliği
    height: '46%', // İki satır için her bir kutunun yüksekliği
    marginBottom: 1.6
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

  searchInputContainer: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    zIndex: 99
  },

  searchInputInnerContainer: {
    width: "95%",
    height: 44,
    backgroundColor: "rgb(236, 236, 236)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 10
  },

  searchInput: {
    width: "84%",
    paddingLeft: 15,
    fontSize: 15,
    color: "rgb(70, 70, 70)",
    fontFamily: "InterNormal"
  },


  footer: {
    width: "100%",
    height: 50,
    position: "absolute",
    right: 0,
    bottom: 50,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 18,
    zIndex: 2,
  },

  noteAddButton: {
    width: 64,
    height: 64,
    backgroundColor: "rgb(213, 179, 27)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 32,
    shadowColor: "rgb(213, 179, 27)",
  },

  noteAddButtonText: {
    fontSize: 35,
    fontWeight: 800,
    color: "rgb(255, 255, 255)",
    zIndex: 99
  },


  flatList: {
    marginHorizontal: 12,
    paddingTop: 10,
    marginTop: 0,
  },

  noteItem: {
    flex: 1,
    height: 108,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14
  },

  noteItemTitleContainer: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row"
  },

  noteTitle: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: "InterBold"
  },

  noteContent: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgb(100, 100, 100)",
    marginBottom: 8,
    fontFamily: "InterNormal"
  },

  noteDate: {
    fontSize: 13,
    color: "rgb(100, 100, 100)",
  },

  gridFlatList: {
    marginHorizontal: 15,
    marginBottom: -22,
    paddingTop: 10,
    paddingBottom: 100,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  gridItem: {
    width: "49%",
    height: 200,
    backgroundColor: "white",
    borderRadius: 12,
    marginRight: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  gridItemDate: {
    fontSize: 13,
    color: "rgb(100, 100, 100)",
  },

  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'InterNormal',
    bottom: 40
  }
})