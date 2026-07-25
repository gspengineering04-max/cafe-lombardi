// App.js
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

const { width, height } = Dimensions.get('window');

// ====== داده‌های پیش‌فرض منوی کافه ======
const DEFAULT_MENU = [
  { id: '1', name: 'اسپرسو', price: 35000, category: 'قهوه', icon: '☕' },
  { id: '2', name: 'کاپوچینو', price: 55000, category: 'قهوه', icon: '☕' },
  { id: '3', name: 'لاته', price: 60000, category: 'قهوه', icon: '☕' },
  { id: '4', name: 'موکا', price: 65000, category: 'قهوه', icon: '☕' },
  { id: '5', name: 'چای سیاه', price: 25000, category: 'نوشیدنی', icon: '🍵' },
  { id: '6', name: 'چای سبز', price: 30000, category: 'نوشیدنی', icon: '🍵' },
  { id: '7', name: 'آب معدنی', price: 15000, category: 'نوشیدنی', icon: '💧' },
  { id: '8', name: 'آبمیوه طبیعی', price: 45000, category: 'نوشیدنی', icon: '🧃' },
  { id: '9', name: 'شیرینی خشک', price: 25000, category: 'دسر', icon: '🍪' },
  { id: '10', name: 'کیک شکلاتی', price: 45000, category: 'دسر', icon: '🎂' },
  { id: '11', name: 'چیزکیک', price: 55000, category: 'دسر', icon: '🍰' },
  { id: '12', name: 'نان و پنیر', price: 35000, category: 'صبحانه', icon: '🧀' },
  { id: '13', name: 'املت', price: 45000, category: 'صبحانه', icon: '🍳' },
  { id: '14', name: 'صبحانه کامل', price: 85000, category: 'صبحانه', icon: '🥘' },
];

const TABLES = ['میز ۱', 'میز ۲', 'میز ۳', 'میز ۴', 'میز ۵', 'میز ۶', 'تراس ۱', 'تراس ۲'];

// ====== کامپوننت اصلی ======
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState(DEFAULT_MENU);
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [showTableModal, setShowTableModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('همه');
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'قهوه', icon: '☕' });
  const [orderList, setOrderList] = useState([]);

  // بارگذاری داده‌ها از ذخیره‌سازی
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedProducts = await AsyncStorage.getItem('products');
      const savedInvoices = await AsyncStorage.getItem('invoices');
      const savedDailySales = await AsyncStorage.getItem('dailySales');
      
      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      if (savedDailySales) setDailySales(JSON.parse(savedDailySales));
    } catch (error) {
      console.log('خطا در بارگذاری داده‌ها');
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('products', JSON.stringify(products));
      await AsyncStorage.setItem('invoices', JSON.stringify(invoices));
      await AsyncStorage.setItem('dailySales', JSON.stringify(dailySales));
    } catch (error) {
      console.log('خطا در ذخیره‌سازی');
    }
  };

  // ====== افزودن به سبد خرید ======
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // ====== حذف از سبد خرید ======
  const removeFromCart = (productId) => {
    const existing = cart.find(item => item.id === productId);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(item => 
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      ));
    } else {
      setCart(cart.filter(item => item.id !== productId));
    }
  };

  // ====== ثبت فاکتور ======
  const createInvoice = () => {
    if (cart.length === 0) {
      Alert.alert('خطا', 'سبد خرید خالی است');
      return;
    }
    if (!selectedTable) {
      Alert.alert('خطا', 'لطفاً میز را انتخاب کنید');
      return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newInvoice = {
      id: Date.now().toString(),
      table: selectedTable,
      items: cart,
      total: total,
      date: new Date().toISOString(),
      status: 'پرداخت شده',
    };

    setInvoices([newInvoice, ...invoices]);
    
    // افزودن به فروش روزانه
    const today = new Date().toDateString();
    const existingDaily = dailySales.find(d => d.date === today);
    if (existingDaily) {
      setDailySales(dailySales.map(d => 
        d.date === today ? { ...d, total: d.total + total, count: d.count + 1 } : d
      ));
    } else {
      setDailySales([...dailySales, { date: today, total: total, count: 1 }]);
    }

    setCart([]);
    setSelectedTable(null);
    saveData();
    Alert.alert('موفق', 'فاکتور با موفقیت ثبت شد');
  };

  // ====== ارسال فاکتور به مشتری از طریق بله ======
  const sendInvoiceToCustomer = async (invoice) => {
    const itemsText = invoice.items.map(item => 
      `${item.icon} ${item.name} (${item.quantity}×${item.price.toLocaleString()} تومان)`
    ).join('\n');
    
    const message = `🧾 *فاکتور کافه لمباردی*\n\n` +
      `📋 میز: ${invoice.table}\n` +
      `📅 تاریخ: ${new Date(invoice.date).toLocaleDateString('fa-IR')}\n` +
      `⏰ ساعت: ${new Date(invoice.date).toLocaleTimeString('fa-IR')}\n\n` +
      `🛒 *محصولات:*\n${itemsText}\n\n` +
      `💰 *جمع کل: ${invoice.total.toLocaleString()} تومان*\n\n` +
      `🙏 از بازدید شما سپاسگزاریم`;

    // شماره مشتری رو از کاربر بگیریم
    Alert.prompt(
      'ارسال فاکتور به مشتری',
      'شماره موبایل مشتری را وارد کنید (با کد 98)',
      [
        { text: 'لغو', style: 'cancel' },
        { 
          text: 'ارسال', 
          onPress: (phone) => {
            if (phone && phone.length >= 10) {
              const cleanPhone = phone.replace(/[^0-9]/g, '');
              const url = `https://ble.ir/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
              Linking.openURL(url).catch(() => {
                Alert.alert('خطا', 'لطفاً اپلیکیشن بله را نصب کنید');
              });
            } else {
              Alert.alert('خطا', 'شماره موبایل معتبر نیست');
            }
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  // ====== ارسال درخواست به تأمین‌کننده ======
  const sendOrderToSupplier = () => {
    if (orderList.length === 0) {
      Alert.alert('اطلاع', 'محصولی برای سفارش انتخاب نشده است');
      return;
    }

    const selectedProducts = products.filter(p => orderList.includes(p.id));
    const message = `📦 *درخواست سفارش محصولات - کافه لمباردی*\n\n` +
      selectedProducts.map(item => 
        `🟢 ${item.icon} ${item.name}`
      ).join('\n') +
      `\n\n📞 لطفاً جهت هماهنگی تماس بگیرید: ۰۹۹۰۱۲۳۴۵۶۷`;

    const url = `https://ble.ir/send?phone=989035028468&text=${encodeURIComponent(message)}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'نصب اپلیکیشن بله',
        'برای ارسال درخواست، لطفاً اپلیکیشن بله را نصب کنید',
        [
          { text: 'نصب از بازار', onPress: () => Linking.openURL('https://ble.ir/download') },
          { text: 'لغو', style: 'cancel' }
        ]
      );
    });
  };

  // ====== افزودن محصول جدید ======
  const addProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      Alert.alert('خطا', 'لطفاً نام و قیمت را وارد کنید');
      return;
    }
    const product = {
      id: Date.now().toString(),
      name: newProduct.name,
      price: parseInt(newProduct.price),
      category: newProduct.category,
      icon: newProduct.icon || '🍽️',
    };
    setProducts([...products, product]);
    setNewProduct({ name: '', price: '', category: 'قهوه', icon: '☕' });
    saveData();
    Alert.alert('موفق', 'محصول با موفقیت اضافه شد');
  };

  // ====== حذف محصول ======
  const deleteProduct = (id) => {
    Alert.alert(
      'حذف محصول',
      'آیا از حذف این محصول مطمئن هستید؟',
      [
        { text: 'لغو', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: () => {
            setProducts(products.filter(p => p.id !== id));
            saveData();
          }
        }
      ]
    );
  };

  // ====== رندر صفحات ======

  // صفحه داشبورد
  const renderDashboard = () => {
    const today = new Date().toDateString();
    const todaySale = dailySales.find(d => d.date === today);
    const totalToday = todaySale ? todaySale.total : 0;
    const orderCount = todaySale ? todaySale.count : 0;
    
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthSales = dailySales.filter(d => {
      const dDate = new Date(d.date);
      return dDate >= monthStart && dDate <= new Date();
    });
    const monthTotal = monthSales.reduce((sum, d) => sum + d.total, 0);

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.greeting}>☕ به کافه لمباردی خوش آمدید</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('fa-IR')}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={32} color="#8B4513" />
            <Text style={styles.statValue}>{totalToday.toLocaleString()} تومان</Text>
            <Text style={styles.statLabel}>فروش امروز</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={32} color="#8B4513" />
            <Text style={styles.statValue}>{monthTotal.toLocaleString()} تومان</Text>
            <Text style={styles.statLabel}>فروش ماه</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="receipt-outline" size={32} color="#8B4513" />
            <Text style={styles.statValue}>{orderCount}</Text>
            <Text style={styles.statLabel}>تعداد فاکتورها</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={32} color="#8B4513" />
            <Text style={styles.statValue}>{TABLES.length}</Text>
            <Text style={styles.statLabel}>میزهای فعال</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.quickOrderBtn} onPress={() => setActiveTab('orders')}>
          <Text style={styles.quickOrderText}>🛒 ثبت سفارش جدید</Text>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // صفحه سفارش/فاکتور
  const renderOrders = () => {
    const filteredProducts = products.filter(p => {
      const matchCategory = selectedCategory === 'همه' || p.category === selectedCategory;
      const matchSearch = p.name.includes(searchQuery);
      return matchCategory && matchSearch;
    });

    const categories = ['همه', ...new Set(products.map(p => p.category))];

    return (
      <View style={styles.tabContent}>
        <View style={styles.orderHeader}>
          <TextInput
            style={styles.searchInput}
            placeholder="جستجوی محصول..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity 
            style={styles.tableSelector} 
            onPress={() => setShowTableModal(true)}
          >
            <Ionicons name="tablet-portrait" size={20} color="#8B4513" />
            <Text style={styles.tableSelectorText}>{selectedTable || 'انتخاب میز'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryBtn, selectedCategory === cat && styles.categoryBtnActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.productCard} onPress={() => addToCart(item)}>
              <Text style={styles.productIcon}>{item.icon}</Text>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{item.price.toLocaleString()} تومان</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                <Ionicons name="add-circle" size={28} color="#8B4513" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>محصولی یافت نشد</Text>}
        />

        {cart.length > 0 && (
          <View style={styles.cartBar}>
            <View style={styles.cartInfo}>
              <Text style={styles.cartCount}>{cart.reduce((s, i) => s + i.quantity, 0)} عدد</Text>
              <Text style={styles.cartTotal}>{cart.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()} تومان</Text>
            </View>
            <TouchableOpacity style={styles.invoiceBtn} onPress={createInvoice}>
              <Text style={styles.invoiceBtnText}>ثبت فاکتور</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // صفحه محصولات (منو)
  const renderProducts = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>➕ افزودن محصول جدید</Text>
        <View style={styles.addProductForm}>
          <TextInput
            style={styles.formInput}
            placeholder="نام محصول"
            value={newProduct.name}
            onChangeText={text => setNewProduct({ ...newProduct, name: text })}
          />
          <TextInput
            style={styles.formInput}
            placeholder="قیمت (تومان)"
            keyboardType="numeric"
            value={newProduct.price}
            onChangeText={text => setNewProduct({ ...newProduct, price: text })}
          />
          <TouchableOpacity style={styles.addProductBtn} onPress={addProduct}>
            <Text style={styles.addProductBtnText}>➕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>📋 منوی کافه</Text>
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.productListItem}>
              <Text style={styles.productListIcon}>{item.icon}</Text>
              <View style={styles.productListInfo}>
                <Text style={styles.productListName}>{item.name}</Text>
                <Text style={styles.productListCategory}>{item.category}</Text>
              </View>
              <Text style={styles.productListPrice}>{item.price.toLocaleString()} تومان</Text>
              <TouchableOpacity onPress={() => deleteProduct(item.id)}>
                <Ionicons name="trash-outline" size={22} color="#ff4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  };

  // صفحه گزارش‌ها
  const renderReports = () => {
    const [reportType, setReportType] = useState('daily');
    const today = new Date().toDateString();
    const todaySale = dailySales.find(d => d.date === today);

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.reportToggle}>
          <TouchableOpacity 
            style={[styles.reportToggleBtn, reportType === 'daily' && styles.reportToggleActive]}
            onPress={() => setReportType('daily')}
          >
            <Text style={[styles.reportToggleText, reportType === 'daily' && styles.reportToggleTextActive]}>
              روزانه
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.reportToggleBtn, reportType === 'monthly' && styles.reportToggleActive]}
            onPress={() => setReportType('monthly')}
          >
            <Text style={[styles.reportToggleText, reportType === 'monthly' && styles.reportToggleTextActive]}>
              ماهانه
            </Text>
          </TouchableOpacity>
        </View>

        {reportType === 'daily' ? (
          <View>
            <Text style={styles.reportTitle}>📊 گزارش فروش امروز</Text>
            {todaySale ? (
              <View style={styles.reportCard}>
                <Text style={styles.reportTotal}>{todaySale.total.toLocaleString()} تومان</Text>
                <Text style={styles.reportDetail}>تعداد فاکتور: {todaySale.count}</Text>
                <Text style={styles.reportDetail}>میانگین هر فاکتور: {(todaySale.total / todaySale.count).toLocaleString()} تومان</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>امروز فروشی ثبت نشده است</Text>
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.reportTitle}>📈 گزارش فروش ماهانه</Text>
            {dailySales.length > 0 ? (
              <View>
                <LineChart
                  data={{
                    labels: dailySales.slice(-7).map(d => new Date(d.date).getDate().toString()),
                    datasets: [{ data: dailySales.slice(-7).map(d => d.total) }]
                  }}
                  width={width - 40}
                  height={200}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(139, 69, 19, ${opacity})`,
                  }}
                  style={styles.chart}
                />
                <View style={styles.monthlyStats}>
                  <Text style={styles.monthlyTotal}>
                    مجموع ماه: {dailySales.reduce((s, d) => s + d.total, 0).toLocaleString()} تومان
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyText}>هنوز داده‌ای برای نمایش وجود ندارد</Text>
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  // صفحه تأمین‌کننده (رفع شده)
  const renderSupplier = () => {
    const toggleOrder = (productId) => {
      setOrderList(prev => 
        prev.includes(productId) 
          ? prev.filter(id => id !== productId)
          : [...prev, productId]
      );
    };

    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.supplierTitle}>📦 سفارش به تأمین‌کننده</Text>
        <Text style={styles.supplierSub}>محصولات مورد نیاز را انتخاب کنید</Text>

        {products.map(product => (
          <TouchableOpacity 
            key={product.id}
            style={[styles.orderItem, orderList.includes(product.id) && styles.orderItemSelected]}
            onPress={() => toggleOrder(product.id)}
          >
            <Text style={styles.orderItemIcon}>{product.icon}</Text>
            <Text style={styles.orderItemName}>{product.name}</Text>
            <View style={styles.orderItemCheck}>
              {orderList.includes(product.id) && (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              )}
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.sendOrderBtn} onPress={sendOrderToSupplier}>
          <Ionicons name="send-outline" size={24} color="#fff" />
          <Text style={styles.sendOrderText}>ارسال سفارش به تأمین‌کننده</Text>
        </TouchableOpacity>

        <View style={styles.supplierInfo}>
          <Text style={styles.supplierInfoText}>📞 شماره تأمین‌کننده: ۰۹۸۹۰۳۵۰۲۸۴۶۸</Text>
          <Text style={styles.supplierInfoSub}>از طریق اپلیکیشن بله ارسال می‌شود</Text>
        </View>
      </ScrollView>
    );
  };

  // ====== مودال انتخاب میز ======
  const TableModal = () => (
    <Modal visible={showTableModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>انتخاب میز</Text>
          <FlatList
            data={TABLES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.tableOption, selectedTable === item && styles.tableOptionSelected]}
                onPress={() => {
                  setSelectedTable(item);
                  setShowTableModal(false);
                }}
              >
                <Text style={styles.tableOptionText}>{item}</Text>
                {selectedTable === item && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowTableModal(false)}>
            <Text style={styles.modalCloseText}>بستن</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ====== رندر اصلی ======
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#8B4513" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>☕ کافه لمباردی</Text>
        <TouchableOpacity onPress={() => Alert.alert('اطلاعات', 'نسخه ۱.۰')}>
          <Ionicons name="information-circle-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'supplier' && renderSupplier()}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('dashboard')}>
          <Ionicons name="home" size={24} color={activeTab === 'dashboard' ? '#8B4513' : '#999'} />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>خانه</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('orders')}>
          <Ionicons name="cart" size={24} color={activeTab === 'orders' ? '#8B4513' : '#999'} />
          <Text style={[styles.tabLabel, activeTab === 'orders' && styles.tabLabelActive]}>سفارش</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('products')}>
          <Ionicons name="restaurant" size={24} color={activeTab === 'products' ? '#8B4513' : '#999'} />
          <Text style={[styles.tabLabel, activeTab === 'products' && styles.tabLabelActive]}>منو</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('reports')}>
          <Ionicons name="stats-chart" size={24} color={activeTab === 'reports' ? '#8B4513' : '#999'} />
          <Text style={[styles.tabLabel, activeTab === 'reports' && styles.tabLabelActive]}>گزارش</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('supplier')}>
          <Ionicons name="truck" size={24} color={activeTab === 'supplier' ? '#8B4513' : '#999'} />
          <Text style={[styles.tabLabel, activeTab === 'supplier' && styles.tabLabelActive]}>تأمین</Text>
        </TouchableOpacity>
      </View>

      <TableModal />
    </SafeAreaView>
  );
}

// ====== استایل‌ها ======
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f0e6' },
  header: {
    backgroundColor: '#8B4513',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, paddingBottom: 70 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0d5c8',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabLabel: { fontSize: 11, color: '#999', marginTop: 2 },
  tabLabelActive: { color: '#8B4513', fontWeight: 'bold' },
  tabContent: { flex: 1, padding: 16 },
  
  // داشبورد
  dashboardHeader: { marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#3d2b1f' },
  dateText: { fontSize: 14, color: '#8B4513', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#3d2b1f', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  quickOrderBtn: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quickOrderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // سفارش
  orderHeader: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0d5c8',
  },
  tableSelector: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0d5c8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableSelectorText: { color: '#3d2b1f', fontSize: 14 },
  categoryScroll: { flexDirection: 'row', marginBottom: 12 },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0d5c8',
  },
  categoryBtnActive: { backgroundColor: '#8B4513', borderColor: '#8B4513' },
  categoryText: { color: '#3d2b1f' },
  categoryTextActive: { color: '#fff' },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 6,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productIcon: { fontSize: 32 },
  productName: { fontSize: 14, fontWeight: '600', color: '#3d2b1f', marginTop: 6 },
  productPrice: { fontSize: 13, color: '#8B4513', marginTop: 2 },
  addBtn: { marginTop: 8 },
  cartBar: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cartInfo: { flexDirection: 'row', gap: 16 },
  cartCount: { fontSize: 16, color: '#3d2b1f' },
  cartTotal: { fontSize: 16, fontWeight: 'bold', color: '#8B4513' },
  invoiceBtn: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  invoiceBtnText: { color: '#fff', fontWeight: 'bold' },

  // محصولات
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#3d2b1f', marginBottom: 10, marginTop: 6 },
  addProductForm: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  formInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0d5c8',
    minWidth: 80,
  },
  addProductBtn: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addProductBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  productListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  productListIcon: { fontSize: 24, marginRight: 12 },
  productListInfo: { flex: 1 },
  productListName: { fontSize: 16, color: '#3d2b1f' },
  productListCategory: { fontSize: 12, color: '#999' },
  productListPrice: { fontSize: 14, fontWeight: 'bold', color: '#8B4513', marginRight: 12 },

  // گزارش‌ها
  reportToggle: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  reportToggleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0d5c8',
    alignItems: 'center',
  },
  reportToggleActive: { backgroundColor: '#8B4513', borderColor: '#8B4513' },
  reportToggleText: { color: '#3d2b1f' },
  reportToggleTextActive: { color: '#fff' },
  reportTitle: { fontSize: 18, fontWeight: 'bold', color: '#3d2b1f', marginBottom: 12 },
  reportCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  reportTotal: { fontSize: 28, fontWeight: 'bold', color: '#8B4513' },
  reportDetail: { fontSize: 16, color: '#3d2b1f', marginTop: 8 },
  chart: { marginVertical: 16, borderRadius: 12 },
  monthlyStats: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  monthlyTotal: { fontSize: 20, fontWeight: 'bold', color: '#8B4513' },

  // تأمین‌کننده
  supplierTitle: { fontSize: 22, fontWeight: 'bold', color: '#3d2b1f' },
  supplierSub: { fontSize: 14, color: '#999', marginBottom: 16 },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  orderItemSelected: { backgroundColor: '#f0f7f0', borderWidth: 1, borderColor: '#4CAF50' },
  orderItemIcon: { fontSize: 24, marginRight: 12 },
  orderItemName: { flex: 1, fontSize: 16, color: '#3d2b1f' },
  orderItemCheck: { width: 30, alignItems: 'center' },
  sendOrderBtn: {
    backgroundColor: '#8B4513',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  sendOrderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  supplierInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  supplierInfoText: { fontSize: 16, color: '#3d2b1f', fontWeight: 'bold' },
  supplierInfoSub: { fontSize: 12, color: '#999', marginTop: 4 },

  // مودال
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#3d2b1f', marginBottom: 16, textAlign: 'center' },
  tableOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableOptionSelected: { backgroundColor: '#f8f0e6' },
  tableOptionText: { fontSize: 16, color: '#3d2b1f' },
  modalCloseBtn: { marginTop: 16, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 10 },
  modalCloseText: { textAlign: 'center', color: '#3d2b1f', fontSize: 16 },
  emptyText: { textAlign: 'center', color: '#999', fontSize: 16, marginTop: 20 },
});