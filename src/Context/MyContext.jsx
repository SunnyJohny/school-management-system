import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';

const MyContext = createContext();

export const useMyContext = () => {
  return useContext(MyContext);
};

export const MyContextProvider = ({ children }) => {
  const db = getFirestore();

  const initialState = {
    products: [],
    sales: [],
    payments: [],
    expenses: [],
    taxes: [],
    cart: [],
    assets: [],
    liabilities: [],
    teachers: [],
    students: [],
    shares: [],
    users: [],
    classes: [],
    companies: [],
    schools: [],
    inventoryData: [],
    purchases: [], // Add purchases here
    productTotals: new Map(),
    overallTotalQuantity: 0,
    productTotalsMap: new Map(),
    overallTotalProductQuantity: 0,
    firstRestockedTimeMap: new Map(),
    user: null,
    selectedCompanyName: '',
    selectedCompanyId: null,
    selectedCompanyAddress: '',
    selectedCompanyPhoneNumber: '', // Add phone number
    selectedCompanyEmail: '', // Add email
    selectedSchoolName: '',
    selectedSchoolId: '',
    isCartOpen: false, // Track cart visibility
    isSidePanelOpen: false, // Track side panel visibility
  };

  const [state, setState] = useState(initialState);

  const searchByDate = (data, fromDate, toDate) => {
    return data.filter(item => {
      const timestamp = item.timestamp?.toDate?.() || new Date(item.timestamp); // Convert if necessary
      return timestamp >= fromDate && timestamp <= toDate;
    });
  };

  // Toggle functions for Cart and Side Panel
  const toggleCart = () => {
    setState((prevState) => ({
      ...prevState,
      isCartOpen: !prevState.isCartOpen
    }));
  };

  const toggleSidePanel = () => {
    setState((prevState) => ({
      ...prevState,
      isSidePanelOpen: !prevState.isSidePanelOpen
    }));
  };

  // Refresh data: will re-fetch snapshots (not reload page)
  const refreshData = useCallback(async () => {
    // Manual re-fetch fallback if needed. Real-time listeners will normally keep state updated.
    try {
      // Fetch schools and companies once (as they are top-level)
      const schoolsSnap = await getDocs(collection(db, 'schools'));
      const schoolsData = schoolsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const companiesSnap = await getDocs(collection(db, 'companies'));
      const companiesData = companiesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setState(prev => ({ ...prev, schools: schoolsData, companies: companiesData }));
    } catch (err) {
      console.error('refreshData error', err);
    }
  }, [db]);

  const searchByKeyword = (items, keyword) => {
    if (!items || !Array.isArray(items) || typeof keyword !== 'string') {
      return [];
    }

    const lowerCaseKeyword = keyword.toLowerCase();

    const containsKeyword = (value) => {
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerCaseKeyword);
      } else if (Array.isArray(value)) {
        return value.some(containsKeyword);
      } else if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(containsKeyword);
      }
      return false;
    };

    return items.filter(item => containsKeyword(item));
  };

  // ---------- Real-time listeners ----------
  // classes (school-scoped)
  useEffect(() => {
    if (!state.selectedSchoolId) {
      // clear classes if no school selected
      setState(prev => ({ ...prev, classes: [] }));
      return;
    }

    const q = query(
      collection(db, `schools/${state.selectedSchoolId}/classes`),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, snapshot => {
      const classesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setState(prev => ({ ...prev, classes: classesData }));
    }, err => {
      console.error('classes onSnapshot error', err);
    });

    return () => unsub();
  }, [db, state.selectedSchoolId]);

  // students (school-scoped)
  useEffect(() => {
    if (!state.selectedSchoolId) {
      setState(prev => ({ ...prev, students: [] }));
      return;
    }

    const q = query(
      collection(db, `schools/${state.selectedSchoolId}/students`),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, snapshot => {
      const studentsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setState(prev => ({ ...prev, students: studentsData }));
    }, err => {
      console.error('students onSnapshot error', err);
    });

    return () => unsub();
  }, [db, state.selectedSchoolId]);

  // teachers (school-scoped)
  useEffect(() => {
    if (!state.selectedSchoolId) {
      setState(prev => ({ ...prev, teachers: [] }));
      return;
    }

    const q = query(
      collection(db, `schools/${state.selectedSchoolId}/teachers`),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, snapshot => {
      const teachersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setState(prev => ({ ...prev, teachers: teachersData }));
    }, err => {
      console.error('teachers onSnapshot error', err);
    });

    return () => unsub();
  }, [db, state.selectedSchoolId]);

  // payments (school-scoped)
  useEffect(() => {
    if (!state.selectedSchoolId) {
      setState(prev => ({ ...prev, payments: [] }));
      return;
    }

    const q = query(
      collection(db, `schools/${state.selectedSchoolId}/payments`),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, snapshot => {
      const paymentsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setState(prev => ({ ...prev, payments: paymentsData }));
    }, err => {
      console.error('payments onSnapshot error', err);
    });

    return () => unsub();
  }, [db, state.selectedSchoolId]);

  // products (company-scoped)
  useEffect(() => {
    if (!state.selectedCompanyId) {
      setState(prev => ({ ...prev, products: [] }));
      return;
    }

    const q = query(
      collection(db, `companies/${state.selectedCompanyId}/products`),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, snapshot => {
      const productsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setState(prev => ({ ...prev, products: productsData }));
    }, err => {
      console.error('products onSnapshot error', err);
    });

    return () => unsub();
  }, [db, state.selectedCompanyId]);

  // sales (company-scoped)
  useEffect(() => {
    if (!state.selectedCompanyId) {
      setState(prev => ({ ...prev, sales: [] }));
      return;
    }

    const q = query(
      collection(db, `companies/${state.selectedCompanyId}/sales`),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, snapshot => {
      const salesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setState(prev => ({ ...prev, sales: salesData }));
    }, err => {
      console.error('sales onSnapshot error', err);
    });

    return () => unsub();
  }, [db, state.selectedCompanyId]);

  // expenses (company-scoped)
  useEffect(() => {
    if (!state.selectedCompanyId) {
      setState(prev => ({ ...prev, expenses: [] }));
      return;
    }

    const q = query(
      collection(db, `companies/${state.selectedCompanyId}/expenses`),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, snapshot => {
      const expensesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setState(prev => ({ ...prev, expenses: expensesData }));
    }, err => {
      console.error('expenses onSnapshot error', err);
    });

    return () => unsub();
  }, [db, state.selectedCompanyId]);

  // purchases (company-scoped)
  useEffect(() => {
    if (!state.selectedCompanyId) {
      setState(prev => ({ ...prev, purchases: [] }));
      return;
    }

    const q = query(
      collection(db, `companies/${state.selectedCompanyId}/purchases`),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, snapshot => {
      const purchasesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setState(prev => ({ ...prev, purchases: purchasesData }));
    }, err => {
      console.error('purchases onSnapshot error', err);
    });

    return () => unsub();
  }, [db, state.selectedCompanyId]);

  // shares (company-scoped)
  useEffect(() => {
    if (!state.selectedCompanyId) {
      setState(prev => ({ ...prev, shares: [] }));
      return;
    }

    const q = query(
      collection(db, `companies/${state.selectedCompanyId}/shares`),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, snapshot => {
      const sharesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setState(prev => ({ ...prev, shares: sharesData }));
    }, err => {
      console.error('shares onSnapshot error', err);
    });

    return () => unsub();
  }, [db, state.selectedCompanyId]);

  // assets (company-scoped)
  useEffect(() => {
    if (!state.selectedCompanyId) {
      setState(prev => ({ ...prev, assets: [] }));
      return;
    }

    const q = query(
      collection(db, `companies/${state.selectedCompanyId}/assets`),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, snapshot => {
      const assetsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setState(prev => ({ ...prev, assets: assetsData }));
    }, err => {
      console.error('assets onSnapshot error', err);
    });

    return () => unsub();
  }, [db, state.selectedCompanyId]);

  // liabilities (company-scoped)
  useEffect(() => {
    if (!state.selectedCompanyId) {
      setState(prev => ({ ...prev, liabilities: [] }));
      return;
    }

    const q = query(
      collection(db, `companies/${state.selectedCompanyId}/liabilities`),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, snapshot => {
      const liabilitiesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setState(prev => ({ ...prev, liabilities: liabilitiesData }));
    }, err => {
      console.error('liabilities onSnapshot error', err);
    });

    return () => unsub();
  }, [db, state.selectedCompanyId]);

  // taxes (company-scoped)
  useEffect(() => {
    if (!state.selectedCompanyId) {
      setState(prev => ({ ...prev, taxes: [] }));
      return;
    }

    const q = query(
      collection(db, `companies/${state.selectedCompanyId}/taxes`),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, snapshot => {
      const taxesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setState(prev => ({ ...prev, taxes: taxesData }));
    }, err => {
      console.error('taxes onSnapshot error', err);
    });

    return () => unsub();
  }, [db, state.selectedCompanyId]);

  // users (school-scoped) - staff
  useEffect(() => {
    if (!state.selectedSchoolId) {
      setState(prev => ({ ...prev, users: [] }));
      return;
    }

    const q = query(
      collection(db, `schools/${state.selectedSchoolId}/users`),
      orderBy('displayName', 'asc')
    );

    const unsub = onSnapshot(q, snapshot => {
      const usersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setState(prev => ({ ...prev, users: usersData }));
    }, err => {
      console.error('users onSnapshot error', err);
    });

    return () => unsub();
  }, [db, state.selectedSchoolId]);

  // schools and companies top-level snapshots (kept as getDocs initial fetch, but also add onSnapshot)
  useEffect(() => {
    // schools listener
    const unsubSchools = onSnapshot(collection(db, 'schools'), snapshot => {
      const schoolsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setState(prev => ({ ...prev, schools: schoolsData }));
    }, err => {
      console.error('schools onSnapshot error', err);
    });

    // companies listener
    const unsubCompanies = onSnapshot(collection(db, 'companies'), snapshot => {
      const companiesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setState(prev => ({ ...prev, companies: companiesData }));
    }, err => {
      console.error('companies onSnapshot error', err);
    });

    return () => {
      unsubSchools && unsubSchools();
      unsubCompanies && unsubCompanies();
    };
  }, [db]);

  // ---------- helpers that still use getDocs once (for ad-hoc fetches) ----------
  const fetchSchools = async () => {
    try {
      const schoolsCollection = collection(db, 'schools');
      const schoolsSnapshot = await getDocs(schoolsCollection);
      const schoolsData = [];

      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolData = { id: schoolDoc.id, ...schoolDoc.data() };

        // Optionally fetch nested users snapshot once
        const usersCollection = collection(db, `schools/${schoolDoc.id}/users`);
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        schoolData.users = usersData;
        schoolsData.push(schoolData);
      }

      setState((prevState) => ({ ...prevState, schools: schoolsData }));
      console.log('Fetched schools and users...', schoolsData);
    } catch (error) {
      console.error('Error fetching schools:', error.message);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []); // initial fetch; real-time listener above will keep it updated

  const updateSelectedSchool = async (schoolName, schoolId) => {
    try {
      const schoolDocRef = doc(db, 'schools', schoolId);
      const schoolDoc = await getDoc(schoolDocRef);

      if (schoolDoc.exists()) {
        const schoolData = schoolDoc.data();
        const schoolAddress = schoolData.address || ''; // Fetch school address
        const schoolPhone = schoolData.phoneNumber || ''; // Fetch school phone number
        const schoolEmail = schoolData.email || ''; // Fetch school email

        setState((prevState) => ({
          ...prevState,
          selectedSchoolName: schoolName,
          selectedSchoolId: schoolId,
          selectedSchoolAddress: schoolAddress,
          selectedSchoolPhoneNumber: schoolPhone,
          selectedSchoolEmail: schoolEmail,
        }));
      }
    } catch (error) {
      console.error('Error fetching selected school address:', error.message);
    }
  };

  // Persist selected school details in localStorage
  useEffect(() => {
    if (state.selectedSchoolName) {
      localStorage.setItem('selectedSchoolName', state.selectedSchoolName);
    }
    if (state.selectedSchoolId) {
      localStorage.setItem('selectedSchoolId', state.selectedSchoolId);
    }
    if (state.selectedSchoolAddress) {
      localStorage.setItem('selectedSchoolAddress', state.selectedSchoolAddress);
    }
    if (state.selectedSchoolPhoneNumber) {
      localStorage.setItem('selectedSchoolPhoneNumber', state.selectedSchoolPhoneNumber);
    }
    if (state.selectedSchoolEmail) {
      localStorage.setItem('selectedSchoolEmail', state.selectedSchoolEmail);
    }
  }, [state.selectedSchoolName, state.selectedSchoolId, state.selectedSchoolAddress, state.selectedSchoolPhoneNumber, state.selectedSchoolEmail]);

  // Retrieve saved school details from localStorage on page load
  useEffect(() => {
    const savedSchoolName = localStorage.getItem('selectedSchoolName');
    const savedSchoolId = localStorage.getItem('selectedSchoolId');
    const savedSchoolAddress = localStorage.getItem('selectedSchoolAddress');
    const savedSchoolPhoneNumber = localStorage.getItem('selectedSchoolPhoneNumber');
    const savedSchoolEmail = localStorage.getItem('selectedSchoolEmail');

    if (savedSchoolName && savedSchoolId) {
      setState((prevState) => ({
        ...prevState,
        selectedSchoolName: savedSchoolName,
        selectedSchoolId: savedSchoolId,
        selectedSchoolAddress: savedSchoolAddress || '',
        selectedSchoolPhoneNumber: savedSchoolPhoneNumber || '',
        selectedSchoolEmail: savedSchoolEmail || '',
      }));
    }
  }, []);

  const fetchCompanies = async () => {
    try {
      const companiesCollection = collection(db, 'companies');
      const companiesSnapshot = await getDocs(companiesCollection);
      const companiesData = [];

      for (const companyDoc of companiesSnapshot.docs) {
        const companyData = { id: companyDoc.id, ...companyDoc.data() };

        const usersCollection = collection(db, `companies/${companyDoc.id}/users`);
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        companyData.users = usersData;
        companiesData.push(companyData);
      }

      setState((prevState) => ({ ...prevState, companies: companiesData }));
      console.log('Fetching companies and users...', companiesData);
    } catch (error) {
      console.error('Error fetching companies:', error.message);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const updateSelectedCompany = async (companyName, companyId) => {
    try {
      const companyDocRef = doc(db, 'companies', companyId);
      const companyDoc = await getDoc(companyDocRef);

      if (companyDoc.exists()) {
        const companyData = companyDoc.data();
        const companyAddress = companyData.address || '';
        const companyPhone = companyData.phoneNumber || '';
        const companyEmail = companyData.email || '';

        setState((prevState) => ({
          ...prevState,
          selectedCompanyName: companyName,
          selectedCompanyId: companyId,
          selectedCompanyAddress: companyAddress,
          selectedCompanyPhoneNumber: companyPhone,
          selectedCompanyEmail: companyEmail,
        }));
      }
    } catch (error) {
      console.error('Error fetching selected company address:', error.message);
    }
  };

  // Persist selected company details in localStorage
  useEffect(() => {
    if (state.selectedCompanyName) {
      localStorage.setItem('selectedCompanyName', state.selectedCompanyName);
    }
    if (state.selectedCompanyId) {
      localStorage.setItem('selectedCompanyId', state.selectedCompanyId);
    }
    if (state.selectedCompanyAddress) {
      localStorage.setItem('selectedCompanyAddress', state.selectedCompanyAddress);
    }
    if (state.selectedCompanyPhoneNumber) {
      localStorage.setItem('selectedCompanyPhoneNumber', state.selectedCompanyPhoneNumber);
    }
    if (state.selectedCompanyEmail) {
      localStorage.setItem('selectedCompanyEmail', state.selectedCompanyEmail);
    }
  }, [state.selectedCompanyName, state.selectedCompanyId, state.selectedCompanyAddress, state.selectedCompanyPhoneNumber, state.selectedCompanyEmail]);

  // Retrieve saved company details from localStorage on page load
  useEffect(() => {
    const savedCompanyName = localStorage.getItem('selectedCompanyName');
    const savedCompanyId = localStorage.getItem('selectedCompanyId');
    const savedCompanyAddress = localStorage.getItem('selectedCompanyAddress');
    const savedCompanyPhoneNumber = localStorage.getItem('selectedCompanyPhoneNumber');
    const savedCompanyEmail = localStorage.getItem('selectedCompanyEmail');

    if (savedCompanyName && savedCompanyId) {
      setState((prevState) => ({
        ...prevState,
        selectedCompanyName: savedCompanyName,
        selectedCompanyId: savedCompanyId,
        selectedCompanyAddress: savedCompanyAddress || '',
        selectedCompanyPhoneNumber: savedCompanyPhoneNumber || '',
        selectedCompanyEmail: savedCompanyEmail || '',
      }));
    }
  }, []);

  // Fetch single user from a company's subcollection
  const fetchUserFromSubCollection = async (companyId, userId) => {
    try {
      const userDocRef = doc(db, `companies/${companyId}/users/${userId}`);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      } else {
        console.error('No such user document!');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user:', error.message);
      return null;
    }
  };

  // Auth listener to map Firebase auth -> app user record in selected company/school
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      if (user && state.selectedCompanyId) {
        const userData = await fetchUserFromSubCollection(state.selectedCompanyId, user.uid);
        if (userData) {
          setState((prevState) => ({
            ...prevState,
            user: userData
          }));
          console.log('User is logged in:', userData);
        }
      } else {
        // Keep user in local state if stored in localStorage; otherwise set null
        console.log('No user logged in for context auth listener');
      }
    });

    return () => unsubscribe();
  }, [state.selectedCompanyId]);

  // Helper: fetch students once (kept for compatibility)
  const fetchStudents = useCallback(async () => {
    try {
      if (!state.selectedSchoolId) {
        console.error("No school selected");
        return;
      }

      const studentsCollectionRef = collection(db, `schools/${state.selectedSchoolId}/students`);
      const studentsSnapshot = await getDocs(studentsCollectionRef);

      if (!studentsSnapshot.empty) {
        const studentsData = studentsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setState((prevState) => ({ ...prevState, students: studentsData }));
        console.log("Fetched students (one-time):", studentsData);
      } else {
        console.warn("No students found!");
      }
    } catch (error) {
      console.error("Error fetching students:", error.message);
    }
  }, [db, state.selectedSchoolId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // The following functions compute aggregated values. They rely on the real-time state arrays above.
  const calculateTotal = useCallback((field) => {
    if (!state.assets || state.assets.length === 0) {
      return 0;
    }

    const total = state.assets
      .filter(asset => asset.status !== "sold")
      .reduce((total, asset) => {
        return total + parseFloat(asset[field] || 0);
      }, 0);

    return total;
  }, [state.assets]);

  const calculateTotalSoldAsset = useCallback(() => {
    if (!state.assets || state.assets.length === 0) return 0;

    const totalSold = state.assets.reduce((total, asset) => {
      return total + parseFloat(asset.value || 0);
    }, 0);

    return totalSold;
  }, [state.assets]);

  const fetchPurchases = useCallback(async () => {
    try {
      if (!state.selectedCompanyId) {
        console.error('No company selected');
        return;
      }

      const purchasesCollectionRef = collection(db, `companies/${state.selectedCompanyId}/purchases`);
      const purchasesSnapshot = await getDocs(purchasesCollectionRef);

      if (!purchasesSnapshot.empty) {
        const purchasesData = purchasesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setState(prev => ({ ...prev, purchases: purchasesData }));
      }
    } catch (err) {
      console.error('Error fetching purchases', err);
    }
  }, [db, state.selectedCompanyId]);

  useEffect(() => {
    if (state.selectedCompanyId) fetchPurchases();
  }, [fetchPurchases, state.selectedCompanyId]);

  const fetchProductsAndCalculateSumOfSales = useCallback(async () => {
    if (!state.selectedCompanyId) return new Map();

    try {
      const productsCollection = collection(db, `companies/${state.selectedCompanyId}/products`);
      const productsSnapshot = await getDocs(productsCollection);

      let overallTotalProductQuantity = 0;
      const productTotalsMap = new Map();

      productsSnapshot.forEach((d) => {
        const data = d.data();
        const name = data.name;
        const quantitySold = data.quantitySold || [];
        if (Array.isArray(quantitySold)) {
          const productTotal = quantitySold.reduce((sum, entry) => {
            const quantityValue = parseInt(entry.quantitySold, 10);
            return !isNaN(quantityValue) ? sum + quantityValue : sum;
          }, 0);
          productTotalsMap.set(name, productTotal);
          overallTotalProductQuantity += productTotal;
        }
      });

      setState(prev => ({
        ...prev,
        productTotalsMap,
        overallTotalProductQuantity
      }));

      return productTotalsMap;
    } catch (err) {
      console.error('Error fetching products', err);
      return new Map();
    }
  }, [db, state.selectedCompanyId]);

  useEffect(() => {
    if (state.selectedCompanyId) {
      fetchProductsAndCalculateSumOfSales();
    }
  }, [fetchProductsAndCalculateSumOfSales, state.selectedCompanyId]);

  // Restocked time computation (keeps using getDocs since it is an aggregate job)
  useEffect(() => {
    const fetchRestockedTimeData = async () => {
      if (!state.selectedCompanyId) return;

      try {
        const productsCollection = collection(db, `companies/${state.selectedCompanyId}/products`);
        const productsSnapshot = await getDocs(productsCollection);

        let overallTotalQuantity = 0;
        const productTotalsMap = new Map();
        const firstRestockedTimeMap = new Map();

        productsSnapshot.forEach((d) => {
          const data = d.data();
          const name = data.name;
          const quantityRestocked = data.quantityRestocked || [];

          if (Array.isArray(quantityRestocked) && quantityRestocked.length > 0) {
            const firstRestockedTime = quantityRestocked[0].time;
            firstRestockedTimeMap.set(name, firstRestockedTime);
          }

          if (Array.isArray(quantityRestocked)) {
            const productTotal = quantityRestocked.reduce((sum, entry) => {
              const quantityValue = parseInt(entry.quantity, 10);
              return !isNaN(quantityValue) ? sum + quantityValue : sum;
            }, 0);

            productTotalsMap.set(name, productTotal);
            overallTotalQuantity += productTotal;
          }
        });

        setState(prev => ({
          ...prev,
          productTotals: productTotalsMap,
          overallTotalQuantity,
          firstRestockedTimeMap
        }));
      } catch (err) {
        console.error('Error fetching restocked time data', err);
      }
    };

    fetchRestockedTimeData();
  }, [db, state.selectedCompanyId]);

  // sales fetch (one-time aggregate, on top of real-time listener)
  useEffect(() => {
    const fetchSales = async () => {
      if (!state.selectedCompanyId) return;
      try {
        const salesData = await (async () => {
          const salesCollection = collection(db, `companies/${state.selectedCompanyId}/sales`);
          const salesSnapshot = await getDocs(salesCollection);
          return salesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        })();

        setState(prev => ({ ...prev, sales: salesData }));
      } catch (err) {
        console.error('Error fetching sales', err);
      }
    };

    fetchSales();
  }, [db, state.selectedCompanyId]);

  // products listing (one-time, on top of real-time listener)
  useEffect(() => {
    const fetchProducts = async () => {
      if (!state.selectedCompanyId) return;
      try {
        const productsCollection = collection(db, `companies/${state.selectedCompanyId}/products`);
        const productsSnapshot = await getDocs(productsCollection);
        const products = productsSnapshot.docs.map((d) => {
          const data = d.data();
          let totalQuantitySold = 0;
          if (Array.isArray(data.quantitySold)) {
            totalQuantitySold = data.quantitySold.reduce((total, sale) => {
              const quantityValue = parseInt(sale.quantitySold, 10);
              return !isNaN(quantityValue) ? total + quantityValue : total;
            }, 0);
          }
          return { id: d.id, ...data, totalQuantitySold };
        });
        setState(prev => ({ ...prev, products }));
      } catch (err) {
        console.error('Error fetching products one-time', err);
      }
    };

    fetchProducts();
  }, [db, state.selectedCompanyId]);

  // Various utility functions (totals, etc.)
  const calculateTotalSalesValue = useCallback((sales) => {
    if (!sales || sales.length === 0) return 0;
    const calculatedTotalSalesValue = sales.reduce((total, sale) => {
      if (sale.products && Array.isArray(sale.products)) {
        return total + sale.products.reduce((acc, product) => acc + parseFloat(product.Amount || 0), 0);
      }
      return total;
    }, 0);

    return calculatedTotalSalesValue.toFixed(2);
  }, []);

  const fetchFeesPaidData = async (schoolId) => {
    if (!schoolId) return [];
    const feesPaidCollection = collection(db, `schools/${schoolId}/payments`);
    const feesPaidSnapshot = await getDocs(feesPaidCollection);
    return feesPaidSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  };

  useEffect(() => {
    const fetchFees = async () => {
      if (!state.selectedSchoolId) return;
      try {
        const feesData = await fetchFeesPaidData(state.selectedSchoolId);
        setState(prev => ({ ...prev, feesPaid: feesData }));
      } catch (err) {
        console.error('Error fetching fees paid data', err);
      }
    };

    fetchFees();
  }, [db, state.selectedSchoolId]);

  const calculateTotalFeesPaid = useCallback((payments) => {
    if (!payments || payments.length === 0) return 0;
    const totalFeesPaid = payments.reduce((total, payment) => {
      if (Array.isArray(payment.items)) {
        return total + payment.items.reduce((sum, item) => {
          const feeValue = parseFloat(item.amount || 0);
          return isNaN(feeValue) ? sum : sum + feeValue;
        }, 0);
      }
      return total;
    }, 0);

    return totalFeesPaid.toFixed(2);
  }, []);

  const calculateTotalCOGS = (filteredSales) => {
    if (!filteredSales || filteredSales.length === 0) return '0.00';

    const totalCOGS = filteredSales.reduce((total, sale) => {
      if (sale.products && Array.isArray(sale.products)) {
        return total + sale.products.reduce((acc, product) => {
          const costPrice = parseFloat(product.costPrice);
          return isNaN(costPrice) ? acc : acc + costPrice;
        }, 0);
      }
      return total;
    }, 0);

    return totalCOGS.toFixed(2);
  };

  const calculateInventoryValue = (startDate, endDate, keyword) => {
    let filteredProducts = state.products || [];

    if (startDate && endDate) {
      filteredProducts = filteredProducts.filter(product => {
        const restockedTime = state.firstRestockedTimeMap.get(product.name);
        if (!restockedTime) return false;
        const restockedDate = new Date(restockedTime);
        return restockedDate >= startDate && restockedDate <= endDate;
      });
    }

    if (keyword) {
      filteredProducts = searchByKeyword(filteredProducts, keyword);
    }

    const totalInventoryValue = filteredProducts.reduce((total, product) => {
      const productTotalValue = (product.costPrice || 0) * (product.quantityRestocked || 0);
      return total + productTotalValue;
    }, 0);

    return totalInventoryValue.toFixed(2);
  };

  // CART helpers (simple local state updates)
  const addToCart = (studentId) => {
    const studentToAdd = state.students.find((s) => s.id === studentId);
    if (!studentToAdd) return console.error('Student not found!');

    const customFee = prompt(`Enter the fee amount for ${studentToAdd.name}:`, studentToAdd.fee || 0);
    const feeAmount = customFee && !isNaN(parseFloat(customFee)) ? parseFloat(customFee) : studentToAdd.fee || 0;

    const existingCartItem = (state.cart || []).find((item) => item.id === studentId);
    if (existingCartItem) {
      const updatedCart = (state.cart || []).map((item) =>
        item.id === studentId ? { ...item, fee: feeAmount } : item
      );
      setState(prev => ({ ...prev, cart: updatedCart }));
    } else {
      const updatedCart = [...(state.cart || []), { ...studentToAdd, fee: feeAmount }];
      setState(prev => ({ ...prev, cart: updatedCart }));
    }
  };

  const removeFromCart = (productId) => {
    const updatedCart = (state.cart || []).filter((item) => item.id !== productId);
    setState(prev => ({ ...prev, cart: updatedCart }));
  };

  const clearCart = () => setState(prev => ({ ...prev, cart: [] }));

  const increaseQuantity = (productId) => {
    const updatedCart = (state.cart || []).map((item) =>
      item.id === productId ? { ...item, quantity: (item.quantity || 0) + 1 } : item
    );
    setState(prev => ({ ...prev, cart: updatedCart }));
  };

  const decreaseQuantity = (productId) => {
    const existingCartItem = (state.cart || []).find((item) => item.id === productId);
    if (existingCartItem && existingCartItem.quantity > 1) {
      const updatedCart = (state.cart || []).map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
      setState(prev => ({ ...prev, cart: updatedCart }));
    } else {
      removeFromCart(productId);
    }
  };

  const calculateTotalAmount = () => {
    const totalAmount = (state.taxes || []).reduce((total, tax) => total + (tax.amount || 0), 0);
    return totalAmount;
  };

  const calculateTotalTaxPaidAmount = useCallback(() => {
    if (!state.taxes || state.taxes.length === 0) return 0;
    return (state.taxes.reduce((total, tax) => total + parseFloat(tax.paidAmount || 0), 0));
  }, [state.taxes]);

  // Logout
  const logout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        setState(prev => ({ ...prev, user: null }));
        console.log('User signed out successfully.');
      })
      .catch((error) => console.error('Error signing out:', error));
  };

  // Persist/load user to/from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setState(prev => ({ ...prev, user: parsedUser }));
      console.log('User loaded from localStorage:', parsedUser);
    }
  }, []);

  useEffect(() => {
    if (state.user) localStorage.setItem('user', JSON.stringify(state.user));
    else localStorage.removeItem('user');
  }, [state.user]);

  // persist selectedCompanyId fallback for initial loads
  useEffect(() => {
    const savedCompanyId = localStorage.getItem('selectedCompanyId');
    if (savedCompanyId && !state.selectedCompanyId) {
      setState(prev => ({ ...prev, selectedCompanyId: savedCompanyId }));
    }
  }, []);

  // persist selectedSchoolId fallback for initial loads
  useEffect(() => {
    const savedSchoolId = localStorage.getItem('selectedSchoolId');
    if (savedSchoolId && !state.selectedSchoolId) {
      setState(prev => ({ ...prev, selectedSchoolId: savedSchoolId }));
    }
  }, []);

  // Expose context value
  return (
    <MyContext.Provider value={{
      state,
      setState,
      updateSelectedCompany,
      updateSelectedSchool,
      calculateTotalCOGS,
      calculateTotalTaxPaidAmount,
      calculateTotalAmount,
      calculateTotalSalesValue,
      fetchUserFromSubCollection,
      calculateInventoryValue,
      calculateTotalSoldAsset,
      fetchProductsAndCalculateSumOfSales,
      searchByKeyword,
      refreshData,
      calculateTotal,
      addToCart,
      calculateTotalFeesPaid,
      removeFromCart,
      clearCart,
      toggleCart,
      toggleSidePanel,
      increaseQuantity,
      fetchCompanies,
      decreaseQuantity,
      logout,
      searchByDate,
    }}>
      {children}
    </MyContext.Provider>
  );
};