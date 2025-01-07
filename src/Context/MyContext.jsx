import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { } from '../firebase';


const MyContext = createContext();

export const useMyContext = () => {
  return useContext(MyContext);
};

export const MyContextProvider = ({ children }) => {
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
    selectedCompanyPhoneNumber: '',  // Add phone number
  selectedCompanyEmail: '',  // Add emai
  selectedSchoolName: '',
        selectedSchoolId: '',
  isCartOpen: false,           // Track cart visibility
  isSidePanelOpen: false        // Track side panel visibility
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

  const refreshData = () => {
    window.location.reload(); // Reloads the entire app
  };
 
  const searchByKeyword = (items, keyword) => {
    console.log('Searching with keyword:', keyword); // Log the keyword
    console.log('Items:', items); // Log the items being searched
    
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
  

   // Function to fetch classes
   const fetchClasses = useCallback(async () => {
    try {
      if (!state.selectedSchoolId) {
        console.error('No school selected');
        return;
      }

      // Firestore path adjusted for schools and classes structure
      const classesCollectionRef = collection(getFirestore(), `schools/${state.selectedSchoolId}/classes`);
      const classesSnapshot = await getDocs(classesCollectionRef);

      if (!classesSnapshot.empty) {
        // Map through Firestore documents to extract class data
        const classesData = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Update the state with the fetched classes
        setState((prevState) => ({ ...prevState, classes: classesData }));
        console.log('Fetched classes:', classesData);
      } else {
        console.warn('No classes found!');
      }
    } catch (error) {
      console.error('Error fetching classes:', error.message);
    }
  }, [state.selectedSchoolId]);

  // Call the fetchClasses function in useEffect
  useEffect(() => {
    fetchClasses(); // Fetch classes whenever selectedSchoolId changes
  }, [fetchClasses]); // Add fetchClasses as a dependency


  const fetchSchools = async () => {
    try {
      const schoolsCollection = collection(getFirestore(), 'schools');
      const schoolsSnapshot = await getDocs(schoolsCollection);
      const schoolsData = [];
  
      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolData = { id: schoolDoc.id, ...schoolDoc.data() };
  
        // If you need to fetch nested collections, such as users under each school:
        const usersCollection = collection(getFirestore(), `schools/${schoolDoc.id}/users`);
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  
        schoolData.users = usersData; // Add users to each school data (optional)
        schoolsData.push(schoolData);
      }
  
      // Update state with the fetched schools data
      setState((prevState) => ({ ...prevState, schools: schoolsData }));
      console.log('Fetching schools and users...', schoolsData);
    } catch (error) {
      console.error('Error fetching schools:', error.message);
    }
  };
  
  useEffect(() => {
    fetchSchools();
  }, []);
  

  // Updated to include the school address
const updateSelectedSchool = async (schoolName, schoolId) => {
  try {
    const schoolDocRef = doc(getFirestore(), 'schools', schoolId);
    const schoolDoc = await getDoc(schoolDocRef);

    if (schoolDoc.exists()) {
      const schoolData = schoolDoc.data();
      const schoolAddress = schoolData.address || '';  // Fetch school address
      const schoolPhone = schoolData.phoneNumber || '';  // Fetch school phone number
      const schoolEmail = schoolData.email || '';  // Fetch school email

      console.log('Selected school address:', schoolAddress);  // Log school address here
      console.log('Selected school number:', schoolPhone);  // Log school phone number here
      console.log('Selected school email:', schoolEmail);  // Log school email here

      setState((prevState) => ({
        ...prevState,
        selectedSchoolName: schoolName,
        selectedSchoolId: schoolId,
        selectedSchoolAddress: schoolAddress,  // Update address in state
        selectedSchoolPhoneNumber: schoolPhone,  // Update phone number in state
        selectedSchoolEmail: schoolEmail,  // Update email in state
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

  if (savedSchoolName && savedSchoolId && savedSchoolAddress && savedSchoolPhoneNumber && savedSchoolEmail) {
    setState((prevState) => ({
      ...prevState,
      selectedSchoolName: savedSchoolName,
      selectedSchoolId: savedSchoolId,
      selectedSchoolAddress: savedSchoolAddress,
      selectedSchoolPhoneNumber: savedSchoolPhoneNumber, // Update phone number in state
      selectedSchoolEmail: savedSchoolEmail,             // Update email in state
    }));
  }
}, []);

  const fetchCompanies = async () => {
    try {
      const companiesCollection = collection(getFirestore(), 'companies');
      const companiesSnapshot = await getDocs(companiesCollection);
      const companiesData = [];

      for (const companyDoc of companiesSnapshot.docs) {
        const companyData = { id: companyDoc.id, ...companyDoc.data() };

        const usersCollection = collection(getFirestore(), `companies/${companyDoc.id}/users`);
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

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

  // Updated to include the company address
  const updateSelectedCompany = async (companyName, companyId) => {
    try {
      const companyDocRef = doc(getFirestore(), 'companies', companyId);
      const companyDoc = await getDoc(companyDocRef);
  
      if (companyDoc.exists()) {
        const companyData = companyDoc.data();
        const companyAddress = companyData.address || '';  // Fetch company address
        const companyPhone = companyData.phoneNumber || '';  // Fetch company phone number
        const companyEmail = companyData.email || '';  // Fetch company email
  
  
        console.log('Selected company address:', companyAddress);  // Log company address here
        console.log('Selected company number:', companyPhone);  // Log company phone number here
        console.log('Selected company email:', companyEmail);  // Log company email here
  
        setState((prevState) => ({
          ...prevState,
          selectedCompanyName: companyName,
          selectedCompanyId: companyId,
          selectedCompanyAddress: companyAddress,  // Update address in state
          selectedCompanyPhoneNumber: companyPhone,  // Update phone number in state
          selectedCompanyEmail: companyEmail,  // Update email in state
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
    
    if (savedCompanyName && savedCompanyId && savedCompanyAddress && savedCompanyPhoneNumber && savedCompanyEmail) {
      setState((prevState) => ({
        ...prevState,
        selectedCompanyName: savedCompanyName,
        selectedCompanyId: savedCompanyId,
        selectedCompanyAddress: savedCompanyAddress,
        selectedCompanyPhoneNumber: savedCompanyPhoneNumber,  // Update address in state
        selectedCompanyEmail: savedCompanyEmail,  // Update address in state
      }));
    }
  }, []);


  const fetchUserFromSubCollection = async (companyId, userId) => {
    try {
      const userDocRef = doc(getFirestore(), `companies/${companyId}/users/${userId}`);
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
        // setState((prevState) => ({ ...prevState, user: null }));
        console.log('refreshed No user is logged in');
      }
    });

    return () => unsubscribe();
  }, [state.selectedCompanyId]);


 ;

const fetchStudents = useCallback(async () => {
  try {
    if (!state.selectedSchoolId) { // Ensure a school is selected
      console.error("No school selected");
      return;
    }

    // Firestore path adjusted for schools and students structure
    const studentsCollectionRef = collection(getFirestore(), `schools/${state.selectedSchoolId}/students`);
    const studentsSnapshot = await getDocs(studentsCollectionRef);

    if (!studentsSnapshot.empty) {
      // Map through Firestore documents to extract student data
      const studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Update the state with the fetched students
      setState((prevState) => ({ ...prevState, students: studentsData }));
      console.log("Fetched students:", studentsData);
    } else {
      console.warn("No students found!");
    }
  } catch (error) {
    console.error("Error fetching students:", error.message);
  }
}, [state.selectedSchoolId]);

// Call the fetchStudents function in useEffect
useEffect(() => {
  fetchStudents(); // Fetch students whenever selectedSchoolId changes
}, [fetchStudents]); // Add fetchStudents as a dependency




  const fetchTeachers = useCallback(async () => {
    try {
      if (!state.selectedSchoolId) { // Use `selectedSchoolId` instead of `selectedCompanyId`
        console.error('No school selected');
        return;
      }
  
      // Adjust the Firestore path to match the schools and teachers structure
      const teachersCollectionRef = collection(getFirestore(), `schools/${state.selectedSchoolId}/teachers`);
      const teachersSnapshot = await getDocs(teachersCollectionRef);
  
      if (!teachersSnapshot.empty) {
        const teachersData = teachersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
  
        // Update the state with the fetched teachers
        setState((prevState) => ({ ...prevState, teachers: teachersData }));
        console.log('Fetched teachers:', teachersData);
      } else {
        console.error('No teachers found!');
      }
    } catch (error) {
      console.error('Error fetching teachers:', error.message);
    }
  }, [state.selectedSchoolId]);
  
  // Call the fetchTeachers function in useEffect
  useEffect(() => {
    fetchTeachers(); // Fetch teachers whenever selectedSchoolId changes
  }, [fetchTeachers]); // Add fetchTeachers as a dependency
  


  const fetchSchoolFeesPayments = useCallback(async () => {
    if (!state.selectedSchoolId) {
      console.error("No school selected");
      return;
    }
  
    try {
      const paymentsCollectionRef = collection(getFirestore(), `schools/${state.selectedSchoolId}/payments`);
      const paymentsSnapshot = await getDocs(paymentsCollectionRef);
  
      if (paymentsSnapshot.empty) {
        console.warn("No payments found!");
        return;
      }
  
      const paymentsData = paymentsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          items: Array.isArray(data.items) ? data.items : [],
          paymentMethod: data.paymentMethod || "",
          staff: data.staff || {},
          studentId: data.studentId || "",
          studentName: data.studentName || "",
          term: data.term || "",
          timestamp: data.timestamp || null,
          totalAmount: parseFloat(data.totalAmount || 0),
        };
      });
  
      setState((prevState) => ({ ...prevState, payments: paymentsData }));
      console.log("Fetched payments:", paymentsData);
    } catch (error) {
      console.error("Error fetching payments:", error.message);
    }
  }, [state.selectedSchoolId]);
  
  
  // Call the fetchSchoolFeesPayments function in useEffect
  useEffect(() => {
    fetchSchoolFeesPayments(); // Fetch payments whenever selectedSchoolId changes
  }, [fetchSchoolFeesPayments]);
  

  const fetchLiabilities = useCallback(async () => {
    try {
      if (!state.selectedCompanyId) {
        console.error('No company selected');
        return;
      }

      const liabilitiesCollectionRef = collection(getFirestore(), `companies/${state.selectedCompanyId}/liabilities`);
      const liabilitiesSnapshot = await getDocs(liabilitiesCollectionRef);

      if (!liabilitiesSnapshot.empty) {
        const liabilitiesData = liabilitiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setState((prevState) => ({ ...prevState, liabilities: liabilitiesData }));
        console.log('Fetched liabilities:', liabilitiesData);
      } else {
        console.error('No liabilities found!');
      }
    } catch (error) {
      console.error('Error fetching liabilities:', error.message);
    }
  }, [state.selectedCompanyId]);

  useEffect(() => {
    fetchLiabilities(); // Call the function to fetch liabilities
  }, [fetchLiabilities]); // Add fetchLiabilities as a dependency




    // Your component state and other hooks here...
  
    const fetchShares = useCallback(async () => {
      try {
        if (!state.selectedCompanyId) {
          console.error('No company selected');
          return;
        }
  
        const sharesCollectionRef = collection(getFirestore(), `companies/${state.selectedCompanyId}/shares`);
        const sharesSnapshot = await getDocs(sharesCollectionRef);
  
        if (!sharesSnapshot.empty) {
          const sharesData = sharesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          setState((prevState) => ({ ...prevState, shares: sharesData }));
          console.log('Fetched shares:', sharesData);
        } else {
          console.error('No shares found!');
        }
      } catch (error) {
        console.error('Error fetching shares:', error.message);
      }
    }, [state.selectedCompanyId]); // Add state.selectedCompanyId as a dependency
  
    // Call fetchShares when selectedCompanyId is updated
    useEffect(() => {
      if (state.selectedCompanyId) {
        fetchShares();
      }
    }, [fetchShares, state.selectedCompanyId]); // Use fetchShares as a dependency
  


    // const fetchStaff = useCallback(async () => {
    //   try {
    //     if (!state.selectedCompanyId) {
    //       console.error('No company selected');
    //       return;
    //     }
  
    //     const staffCollectionRef = collection(getFirestore(), `companies/${state.selectedCompanyId}/users`);
    //     const staffSnapshot = await getDocs(staffCollectionRef);
  
    //     if (!staffSnapshot.empty) {
    //       const staffData = staffSnapshot.docs.map((doc) => ({
    //         id: doc.id,
    //         ...doc.data()
    //       }));
    //       setState((prevState) => ({ ...prevState, users: staffData }));
    //       console.log('Fetched staff:', staffData);
    //     } else {
    //       console.error('No staff found!');
    //     }
    //   } catch (error) {
    //     console.error('Error fetching staff:', error.message);
    //   }
    // }, [state.selectedCompanyId]);
  
    // useEffect(() => {
    //   if (state.selectedCompanyId) {
    //     fetchStaff();
    //   }
    // }, [fetchStaff,state.selectedCompanyId]); // Call fetchStaff when it changes
  
    const fetchStaff = useCallback(async () => {
      try {
        if (!state.selectedSchoolId) {
          console.error('No school selected');
          return;
        }
    
        const staffCollectionRef = collection(getFirestore(), `schools/${state.selectedSchoolId}/users`);
        const staffSnapshot = await getDocs(staffCollectionRef);
    
        if (!staffSnapshot.empty) {
          const staffData = staffSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          setState((prevState) => ({ ...prevState, users: staffData }));
          console.log('Fetched staff:', staffData);
        } else {
          console.error('No staff found!');
        }
      } catch (error) {
        console.error('Error fetching staff:', error.message);
      }
    }, [state.selectedSchoolId]);
    
    useEffect(() => {
      if (state.selectedSchoolId) {
        fetchStaff();
      }
    }, [fetchStaff, state.selectedSchoolId]); // Call fetchStaff when it changes
    
  
    const fetchAssets = useCallback(async () => {
      try {
        if (!state.selectedCompanyId) {
          console.error('No company selected');
          return;
        }
  
        const assetsCollectionRef = collection(getFirestore(), `companies/${state.selectedCompanyId}/assets`);
        const assetsSnapshot = await getDocs(assetsCollectionRef);
  
        if (!assetsSnapshot.empty) {
          const assetsData = assetsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          setState((prevState) => ({ ...prevState, assets: assetsData }));
          console.log('Fetched assets:', assetsData);
        } else {
          console.error('No assets found!');
        }
      } catch (error) {
        console.error('Error fetching assets:', error.message);
      }
    }, [state.selectedCompanyId]);
  
    useEffect(() => {
      if (state.selectedCompanyId) {
        fetchAssets();
      }
    }, [fetchAssets,state.selectedCompanyId]);
  
  
  const calculateTotal = useCallback((field) => {
    if (!state.assets || state.assets.length === 0) {
      console.log('Assets array is empty');
      return 0; // Return a number
    }
  
    const total = state.assets
      .filter(asset => asset.status !== "sold") // Exclude sold assets
      .reduce((total, asset) => {
        return total + parseFloat(asset[field] || 0);
      }, 0);
  
    return total; // Return the number directly
  }, [state.assets]);
  
  const calculateTotalSoldAsset = useCallback(() => {
    if (!state.assets || state.assets.length === 0) {
      console.log('Assets array is empty');
      return 0; // Return a number
    }
  
    const totalSold = state.assets.reduce((total, asset) => {
      return total + parseFloat(asset.value || 0); // Assuming 'value' is the field you want to sum
    }, 0);
  
    return totalSold; // Return the number directly
  }, [state.assets]);
  

  
// Fetch purchases function similar to fetchExpenses
const fetchPurchases = useCallback(async () => {
  try {
    if (!state.selectedCompanyId) {
      console.error('No company selected');
      return;
    }

    const purchasesCollectionRef = collection(getFirestore(), `companies/${state.selectedCompanyId}/purchases`);
    const purchasesSnapshot = await getDocs(purchasesCollectionRef);

    if (!purchasesSnapshot.empty) {
      const purchasesData = purchasesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setState((prevState) => ({ ...prevState, purchases: purchasesData }));
      console.log('Fetched purchases:', purchasesData);
    } else {
      console.error('No purchases found!');
    }
  } catch (error) {
    console.error('Error fetching purchases:', error.message);
  }
}, [state.selectedCompanyId]);

// Fetch purchases when selectedCompanyId updates
useEffect(() => {
  if (state.selectedCompanyId) {
    fetchPurchases();
  }
}, [fetchPurchases, state.selectedCompanyId]);


  const fetchExpenses = useCallback(async () => {
    try {
      if (!state.selectedCompanyId) {
        console.error('No company selected');
        return;
      }

      const expensesCollectionRef = collection(getFirestore(), `companies/${state.selectedCompanyId}/expenses`);
      const expensesSnapshot = await getDocs(expensesCollectionRef);

      if (!expensesSnapshot.empty) {
        const expensesData = expensesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setState((prevState) => ({ ...prevState, expenses: expensesData }));
        console.log('Fetched expenses:', expensesData);
      } else {
        console.error('No expenses found!');
      }
    } catch (error) {
      console.error('Error fetching expenses:', error.message);
    }
  }, [state.selectedCompanyId]); // Add state.selectedCompanyId as a dependency

  // Call fetchExpenses when selectedCompanyId is updated
  useEffect(() => {
    if (state.selectedCompanyId) {
      fetchExpenses();
    }
  }, [fetchExpenses, state.selectedCompanyId]); 

// Ensure selectedCompanyId is set before fetching expenses
useEffect(() => {
  const savedCompanyId = localStorage.getItem('selectedCompanyId');
  if (savedCompanyId) {
    setState((prevState) => ({
      ...prevState,
      selectedCompanyId: savedCompanyId,
    }));
  }
}, []);


const fetchTaxes = useCallback(async () => {
  try {
    if (!state.selectedCompanyId) {
      console.error('No company selected');
      return;
    }

    const taxesCollectionRef = collection(getFirestore(), `companies/${state.selectedCompanyId}/taxes`);
    const taxesSnapshot = await getDocs(taxesCollectionRef);

    if (!taxesSnapshot.empty) {
      const taxesData = taxesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setState((prevState) => ({ ...prevState, taxes: taxesData }));
      console.log('Fetched taxes:', taxesData);
    } else {
      console.error('No taxes found!');
    }
  } catch (error) {
    console.error('Error fetching taxes:', error.message);
  }
}, [state.selectedCompanyId]);

useEffect(() => {
  if (state.selectedCompanyId) {
    fetchTaxes();
  }
}, [fetchTaxes,state.selectedCompanyId]);


  const calculateTotalAmount = () => {
    const totalAmount = state.taxes.reduce((total, tax) => total + tax.amount, 0);
    return totalAmount;
  };
 

  const calculateTotalTaxPaidAmount = useCallback(() => {
    if (!state.taxes || state.taxes.length === 0) {
      console.log('Taxes array is empty');
      return 0; // Return a number
    }
  
    const totalPaidAmount = state.taxes.reduce((total, tax) => {
      return total + parseFloat(tax.paidAmount || 0);
    }, 0);
  
    return totalPaidAmount; // Return the number directly
  }, [state.taxes]);
  


 const fetchProductsAndCalculateSumOfSales = useCallback(async () => {
    if (!state.selectedCompanyId) {
      console.warn('No company selected');
      return;
    }

    try {
      const productsCollection = collection(getFirestore(), `companies/${state.selectedCompanyId}/products`);
      const productsSnapshot = await getDocs(productsCollection);

      let overallTotalProductQuantity = 0;
      const productTotalsMap = new Map();

      productsSnapshot.forEach((doc) => {
        const { name, quantitySold } = doc.data();

        if (Array.isArray(quantitySold)) {
          const productTotal = quantitySold.reduce((sum, entry) => {
            const quantityValue = parseInt(entry.quantitySold, 10);

            if (!isNaN(quantityValue)) {
              return sum + quantityValue;
            } else {
              console.error(`Invalid quantity value for ${name}: ${entry.quantitySold}`);
              return sum;
            }
          }, 0);

          productTotalsMap.set(name, productTotal);
          overallTotalProductQuantity += productTotal;
        } else {
          console.warn(`Invalid quantitySold value for ${name}: ${quantitySold}`);
        }
      });

      setState((prevState) => ({
        ...prevState,
        productTotalsMap: productTotalsMap,
        overallTotalProductQuantity: overallTotalProductQuantity,
      }));

      return productTotalsMap;
    } catch (error) {
      console.error('Error fetching products:', error.message);
      return new Map();
    }
  }, [state.selectedCompanyId]); // Only re-create the function when selectedCompanyId changes

  useEffect(() => {
    if (state.selectedCompanyId) {
      fetchProductsAndCalculateSumOfSales();
    }
  }, [fetchProductsAndCalculateSumOfSales,state.selectedCompanyId]); // Use fetchProductsAndCalculateSumOfSales as dependency

  

  useEffect(() => {
    const fetchRestockedTimeData = async () => {
      if (!state.selectedCompanyId) {
        console.warn('No company selected');
        return;
      }
    
      try {
        const productsCollection = collection(getFirestore(), `companies/${state.selectedCompanyId}/products`);
        const productsSnapshot = await getDocs(productsCollection);
    
        let overallTotalQuantity = 0;
        const productTotalsMap = new Map();
        const firstRestockedTimeMap = new Map();
    
        productsSnapshot.forEach((doc) => {
          const { name, quantityRestocked } = doc.data();
    
          if (Array.isArray(quantityRestocked) && quantityRestocked.length > 0) {
            const firstRestockedTime = quantityRestocked[0].time;
            firstRestockedTimeMap.set(name, firstRestockedTime);
          }
    
          if (Array.isArray(quantityRestocked)) {
            const productTotal = quantityRestocked.reduce((sum, entry) => {
              const quantityValue = parseInt(entry.quantity, 10);
    
              if (!isNaN(quantityValue)) {
                return sum + quantityValue;
              } else {
                console.error(`Invalid quantity value for ${name}: ${entry.quantity}`);
                return sum;
              }
            }, 0);
    
            productTotalsMap.set(name, productTotal);
            overallTotalQuantity += productTotal;
    
            // Log each product's total
            console.log(`Product: ${name}, Total Quantity Restocked: ${productTotal}`);
          }
        });
    
        // Log overall totals
        console.log('Overall Total Quantity:', overallTotalQuantity);
        console.log('Product Totals Map:', Array.from(productTotalsMap.entries()));
        console.log('First Restocked Time Map:', Array.from(firstRestockedTimeMap.entries()));
    
        setState((prevState) => ({
          ...prevState,
          productTotals: productTotalsMap,
          overallTotalQuantity: overallTotalQuantity,
          firstRestockedTimeMap: firstRestockedTimeMap,
        }));
      } catch (error) {
        console.error('Error fetching restocked time data:', error.message);
      }
    };
    
    fetchRestockedTimeData();
  }, [state.selectedCompanyId]);
  

  const fetchSalesData = async (companyId) => {
    const db = getFirestore();
    const salesCollection = collection(db, `companies/${companyId}/sales`);
    const salesSnapshot = await getDocs(salesCollection);
    const salesData = salesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return salesData;
  };
  
  useEffect(() => {
    const fetchSales = async () => {
      if (!state.selectedCompanyId) {
        console.warn('No company selected');
        return;
      }
  
      try {
        const salesData = await fetchSalesData(state.selectedCompanyId);
        setState((prevState) => ({ ...prevState, sales: salesData }));
      } catch (error) {
        console.error('Error fetching sales:', error);
      }
    };
  
    fetchSales();
  }, [state.selectedCompanyId]);
  
  useEffect(() => {
    const fetchProducts = async () => {
      if (!state.selectedCompanyId) {
        console.warn('No company selected');
        return;
      }
  
      try {
        const productsCollection = collection(getFirestore(), `companies/${state.selectedCompanyId}/products`);
        const productsSnapshot = await getDocs(productsCollection);
        const products = productsSnapshot.docs.map((doc) => {
          const data = doc.data();
  
          // Calculate total quantity sold
          let totalQuantitySold = 0;
          if (Array.isArray(data.quantitySold)) {
            totalQuantitySold = data.quantitySold.reduce((total, sale) => {
              const quantityValue = parseInt(sale.quantitySold, 10);
              return !isNaN(quantityValue) ? total + quantityValue : total;
            }, 0);
          } else {
            console.warn(`Invalid or missing quantitySold value for product ${doc.id}`);
          }
  
          return { id: doc.id, ...data, totalQuantitySold };
        });
  
        // Log products to the console
        console.log('Fetched products with total quantity sold:', products);
  
        setState((prevState) => ({ ...prevState, products }));
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
  
    fetchProducts();
  }, [state.selectedCompanyId]);
  
  

  useEffect(() => {
    const filterProducts = async () => {
      try {
        const startDate = new Date(2023, 4, 1);
        const endDate = new Date(2023, 6, 31);

        const db = getFirestore();
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);

        const filteredProducts = productsSnapshot.docs
          .filter((doc) => {
            const restockedDates = doc.data().restockedDates || [];
            return restockedDates.some(
              (date) => date >= startDate && date <= endDate
            );
          })
          .map((doc) => doc.data());

        setState((prevState) => ({ ...prevState, filteredProducts }));
      } catch (error) {
        console.error('Error filtering products:', error);
      }
    };

    filterProducts();
  }, []);

  const logout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        setState((prevState) => ({ ...prevState, user: null }));
        console.log('User signed out successfully.');
      })
      .catch((error) => {
        console.error('Error signing out:', error);
      });
  };


  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setState((prevState) => ({
        ...prevState,
        user: parsedUser,
      }));
      console.log('User loaded from localStorage:', parsedUser);
    }
  }, []);

  useEffect(() => {
    if (state.user) {
      localStorage.setItem('user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('user');
    }
  }, [state.user]);




  const addToCart = (studentId) => {
    // Find the student to add by ID
    const studentToAdd = state.students.find((student) => student.id === studentId);
  
    if (studentToAdd) {
      // Prompt for a custom fee amount (e.g., tuition fee)
      const customFee = prompt(
        `Enter the fee amount for ${studentToAdd.name}:`,
        studentToAdd.fee || 0 // Default to existing fee if available
      );
  
      // Validate and update the fee amount
      const feeAmount = customFee && !isNaN(parseFloat(customFee))
        ? parseFloat(customFee)
        : studentToAdd.fee || 0;
  
      // Check if the student already exists in the cart
      const existingCartItem = state.cart.find((item) => item.id === studentId);
  
      if (existingCartItem) {
        // Update the cart item for the existing student (e.g., increase a count or handle updates)
        const updatedCart = state.cart.map((item) =>
          item.id === studentId
            ? { ...item, fee: feeAmount } // Update the fee amount
            : item
        );
        setState({ ...state, cart: updatedCart });
      } else {
        // Add the new student to the cart with the custom fee amount
        const updatedCart = [
          ...state.cart,
          { ...studentToAdd, fee: feeAmount },
        ];
        setState({ ...state, cart: updatedCart });
      }
    } else {
      console.error('Student not found!');
    }
  };
  

  const removeFromCart = (productId) => {
    const updatedCart = state.cart.filter((item) => item.id !== productId);
    setState({ ...state, cart: updatedCart });
  };

  const clearCart = () => {
    setState({ ...state, cart: [] });
  };

  


  const increaseQuantity = (productId) => {
    const updatedCart = state.cart.map((item) =>
      item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
    );
    setState({ ...state, cart: updatedCart });
  };

  const decreaseQuantity = (productId) => {
    const existingCartItem = state.cart.find((item) => item.id === productId);
    if (existingCartItem && existingCartItem.quantity > 1) {
      const updatedCart = state.cart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
      setState({ ...state, cart: updatedCart });
    } else {
      removeFromCart(productId);
    }
  };



    const calculateTotalSalesValue = useCallback((sales) => {
    if (!sales || sales.length === 0) {
      console.log('Sales array is empty');
      return 0;
    }

    const calculatedTotalSalesValue = sales.reduce((total, sale) => {
      if (sale.products && Array.isArray(sale.products)) {
        return total + sale.products.reduce((acc, product) => acc + parseFloat(product.Amount || 0), 0);
      } else {
        console.log('Undefined products array in sale:', sale);
        return total;
      }
    }, 0);

    return calculatedTotalSalesValue.toFixed(2);
  }, []);
  const fetchFeesPaidData = async (schoolId) => {
    const db = getFirestore();
    const feesPaidCollection = collection(db, `schools/${schoolId}/payments`);
    const feesPaidSnapshot = await getDocs(feesPaidCollection);
    const feesPaidData = feesPaidSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return feesPaidData;
  };
  
  useEffect(() => {
    const fetchFees = async () => {
      if (!state.selectedSchoolId) {
        console.warn('No school selected');
        return;
      }
  
      try {
        const feesData = await fetchFeesPaidData(state.selectedSchoolId);
        setState((prevState) => ({ ...prevState, feesPaid: feesData }));
      } catch (error) {
        console.error('Error fetching fees paid data:', error);
      }
    };
  
    fetchFees();
  }, [state.selectedSchoolId]);
  
  const calculateTotalFeesPaid = useCallback((payments) => {
    if (!payments || payments.length === 0) {
      console.log("Payments array is empty");
      return 0;
    }
  
    const totalFeesPaid = payments.reduce((total, payment) => {
      if (Array.isArray(payment.items)) {
        return total + payment.items.reduce((sum, item) => {
          const feeValue = parseFloat(item.amount || 0);
          return isNaN(feeValue) ? sum : sum + feeValue;
        }, 0);
      } else {
        console.warn("Invalid items array in payment:", payment);
        return total;
      }
    }, 0);
  
    return totalFeesPaid.toFixed(2);
  }, []);
  


  const calculateTotalCOGS = (filteredSales) => {
    if (!filteredSales || filteredSales.length === 0) {
      return '0.00'; // Return '0.00' if no sales are available
    }
  
    const totalCOGS = filteredSales.reduce((total, sale) => {
      if (sale.products && Array.isArray(sale.products)) {
        return total + sale.products.reduce((acc, product) => {
          const costPrice = parseFloat(product.costPrice);
          return isNaN(costPrice) ? acc : acc + costPrice;
        }, 0);
      } else {
        console.error('Undefined or non-array products in sale:', sale);
        return total;
      }
    }, 0);
  
    return totalCOGS.toFixed(2);
  };
  
  // const calculateAccountsReceivable = () => {
  //   if (!state.selectedCompanyId) {
  //     console.warn('No company selected');
  //     return 0;
  //   }

  //   // Filter sales by selected date range
  //   const filteredSales = filterByDate(state.sales, 'date');

  //   const totalCreditSum = filteredSales
  //     .filter((sale) => sale.payment && sale.payment.method === 'Credit')
  //     .reduce((sum, sale) => sum + (Number(sale.totalAmount) || 0), 0);

  //   console.log('Total credit sales sum:', totalCreditSum);
  //   return totalCreditSum;
  // };

  const calculateInventoryValue = (startDate, endDate, keyword) => {
    let filteredProducts = state.products;
  
    // Apply date filtering based on the first restocked time
    if (startDate && endDate) {
      filteredProducts = filteredProducts.filter(product => {
        const restockedTime = state.firstRestockedTimeMap.get(product.name);
        const restockedDate = new Date(restockedTime);
        return restockedDate >= startDate && restockedDate <= endDate;
      });
    }
  
    // Apply keyword filtering
    if (keyword) {
      filteredProducts = searchByKeyword(filteredProducts, keyword);
    }
  
    const totalInventoryValue = filteredProducts.reduce((total, product) => {
      // Assuming 'costPrice' is the value per unit, and 'quantityRestocked' represents the quantity in inventory
      const productTotalValue = (product.costPrice || 0) * (product.quantityRestocked || 0);
      return total + productTotalValue;
    }, 0);
  
    return totalInventoryValue.toFixed(2);
  };
  


  return (
    <MyContext.Provider value={{
      state, setState, updateSelectedCompany, updateSelectedSchool,
      calculateTotalCOGS,
      calculateTotalTaxPaidAmount,
      calculateTotalAmount,
      calculateTotalSalesValue,
      fetchUserFromSubCollection,
      // calculateAccountsReceivable,
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
      searchByDate 




    }}>
      {children}
    </MyContext.Provider>
  );
};