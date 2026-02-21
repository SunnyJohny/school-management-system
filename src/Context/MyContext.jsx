import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";

const MyContext = createContext();

export const useMyContext = () => {
  return useContext(MyContext);
};

export const MyContextProvider = ({ children }) => {
  const db = getFirestore();

  const initialState = {
    // ✅ SCHOOL ONLY
    teachers: [],
    students: [],
    users: [],
    classes: [],
    schools: [],
    payments: [],
    feesPaid: [],

    // ✅ P&L (optional but recommended)
    expenses: [],
    taxes: [],

    // ✅ UI / local
    cart: [],
    isCartOpen: false,
    isSidePanelOpen: false,

    // ✅ selections
    selectedSchoolName: "",
    selectedSchoolId: "",
    selectedSchoolAddress: "",
    selectedSchoolPhoneNumber: "",
    selectedSchoolEmail: "",

    // ✅ auth/user
    user: null,
  };

  const [state, setState] = useState(initialState);

  // ✅ Safe date filter (works with Firestore Timestamp + normal dates)
  const searchByDate = (data, fromDate, toDate) => {
    const list = Array.isArray(data) ? data : [];

    // No date selected => return all
    if (!fromDate && !toDate) return list;

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    // include whole "to" day
    if (to) to.setHours(23, 59, 59, 999);

    return list.filter((item) => {
      const raw =
        item?.timestamp || item?.createdAt || item?.date || item?.Timestamp;

      if (!raw) return false;

      const d = raw?.toDate ? raw.toDate() : new Date(raw);
      if (Number.isNaN(d.getTime())) return false;

      if (from && d < from) return false;
      if (to && d > to) return false;

      return true;
    });
  };

  // ✅ Revenue (Fees) total: sums either payment.items[].amount OR payment.amount/paidAmount/totalAmount
  const calculateTotalRevenue = useCallback((payments) => {
    const list = Array.isArray(payments) ? payments : [];

    const total = list.reduce((acc, payment) => {
      // If payment has items array (your existing structure)
      if (Array.isArray(payment?.items)) {
        const itemsTotal = payment.items.reduce((sum, item) => {
          const v = parseFloat(item?.amount ?? item?.fee ?? 0);
          return isNaN(v) ? sum : sum + v;
        }, 0);
        return acc + itemsTotal;
      }

      // fallback: single amount fields
      const single = parseFloat(
        payment?.amount ?? payment?.paidAmount ?? payment?.totalAmount ?? 0
      );
      return isNaN(single) ? acc : acc + single;
    }, 0);

    return Number(total.toFixed(2));
  }, []);

  // ✅ Expenses total: sums expense.amount
  const calculateTotalExpenses = useCallback((expenses) => {
    const list = Array.isArray(expenses) ? expenses : [];
    const total = list.reduce((acc, exp) => {
      const v = parseFloat(exp?.amount ?? 0);
      return isNaN(v) ? acc : acc + v;
    }, 0);
    return Number(total.toFixed(2));
  }, []);

  // ✅ Taxes total: sums tax.paidAmount OR tax.amount
  const calculateTotalTaxes = useCallback((taxes) => {
    const list = Array.isArray(taxes) ? taxes : [];
    const total = list.reduce((acc, tax) => {
      const v = parseFloat(tax?.paidAmount ?? tax?.amount ?? 0);
      return isNaN(v) ? acc : acc + v;
    }, 0);
    return Number(total.toFixed(2));
  }, []);

  // Toggle functions for Cart and Side Panel
  const toggleCart = () => {
    setState((prevState) => ({
      ...prevState,
      isCartOpen: !prevState.isCartOpen,
    }));
  };

  const toggleSidePanel = () => {
    setState((prevState) => ({
      ...prevState,
      isSidePanelOpen: !prevState.isSidePanelOpen,
    }));
  };

  // ✅ refreshData (schools only)
  const refreshData = useCallback(async () => {
    try {
      const schoolsSnap = await getDocs(collection(db, "schools"));
      const schoolsData = schoolsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setState((prev) => ({
        ...prev,
        schools: schoolsData,
      }));
    } catch (err) {
      // removed console output
    }
  }, [db]);

  const searchByKeyword = (items, keyword) => {
    if (!items || !Array.isArray(items) || typeof keyword !== "string") {
      return [];
    }

    const lowerCaseKeyword = keyword.toLowerCase();

    const containsKeyword = (value) => {
      if (typeof value === "string") {
        return value.toLowerCase().includes(lowerCaseKeyword);
      } else if (Array.isArray(value)) {
        return value.some(containsKeyword);
      } else if (typeof value === "object" && value !== null) {
        return Object.values(value).some(containsKeyword);
      }
      return false;
    };

    return items.filter((item) => containsKeyword(item));
  };

  // ---------- Real-time listeners ----------
  // classes (school-scoped)
  useEffect(() => {
    if (!state.selectedSchoolId) {
      setState((prev) => ({ ...prev, classes: [] }));
      return;
    }

    const q = query(
      collection(db, `schools/${state.selectedSchoolId}/classes`),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const classesData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setState((prev) => ({ ...prev, classes: classesData }));
      },
      () => {
        // removed console output
      }
    );

    return () => unsub();
  }, [db, state.selectedSchoolId]);

  // students (school-scoped)
  useEffect(() => {
    if (!state.selectedSchoolId) {
      setState((prev) => ({ ...prev, students: [] }));
      return;
    }

    const q = query(
      collection(db, `schools/${state.selectedSchoolId}/students`),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const studentsData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setState((prev) => ({ ...prev, students: studentsData }));
      },
      () => {
        // removed console output
      }
    );

    return () => unsub();
  }, [db, state.selectedSchoolId]);

  // teachers (school-scoped)
  useEffect(() => {
    if (!state.selectedSchoolId) {
      setState((prev) => ({ ...prev, teachers: [] }));
      return;
    }

    const q = query(
      collection(db, `schools/${state.selectedSchoolId}/teachers`),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const teachersData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setState((prev) => ({ ...prev, teachers: teachersData }));
      },
      () => {
        // removed console output
      }
    );

    return () => unsub();
  }, [db, state.selectedSchoolId]);

  // payments (school-scoped)
  useEffect(() => {
    if (!state.selectedSchoolId) {
      setState((prev) => ({ ...prev, payments: [] }));
      return;
    }

    const q = query(
      collection(db, `schools/${state.selectedSchoolId}/payments`),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const paymentsData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setState((prev) => ({ ...prev, payments: paymentsData }));
      },
      () => {
        // removed console output
      }
    );

    return () => unsub();
  }, [db, state.selectedSchoolId]);

  // ✅ expenses (school-scoped)
  useEffect(() => {
    if (!state.selectedSchoolId) {
      setState((prev) => ({ ...prev, expenses: [] }));
      return;
    }

    const q = query(
      collection(db, `schools/${state.selectedSchoolId}/expenses`),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const expensesData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setState((prev) => ({ ...prev, expenses: expensesData }));
      },
      () => {
        // removed console output
      }
    );

    return () => unsub();
  }, [db, state.selectedSchoolId]);

  // ✅ taxes (school-scoped)
  useEffect(() => {
    if (!state.selectedSchoolId) {
      setState((prev) => ({ ...prev, taxes: [] }));
      return;
    }

    const q = query(
      collection(db, `schools/${state.selectedSchoolId}/taxes`),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const taxesData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setState((prev) => ({ ...prev, taxes: taxesData }));
      },
      () => {
        // removed console output
      }
    );

    return () => unsub();
  }, [db, state.selectedSchoolId]);

  // users (school-scoped) - staff
  useEffect(() => {
    if (!state.selectedSchoolId) {
      setState((prev) => ({ ...prev, users: [] }));
      return;
    }

    const q = query(
      collection(db, `schools/${state.selectedSchoolId}/users`),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const usersData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setState((prev) => ({ ...prev, users: usersData }));
      },
      () => {
        // removed console output
      }
    );

    return () => unsub();
  }, [db, state.selectedSchoolId]);

  // schools top-level snapshot
  useEffect(() => {
    const unsubSchools = onSnapshot(
      collection(db, "schools"),
      (snapshot) => {
        const schoolsData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setState((prev) => ({ ...prev, schools: schoolsData }));
      },
      () => {
        // removed console output
      }
    );

    return () => {
      unsubSchools && unsubSchools();
    };
  }, [db]);

  // ✅ fetchSchools wrapped in useCallback and used as dep
  const fetchSchools = useCallback(async () => {
    try {
      const schoolsCollection = collection(db, "schools");
      const schoolsSnapshot = await getDocs(schoolsCollection);
      const schoolsData = [];

      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolData = { id: schoolDoc.id, ...schoolDoc.data() };

        const usersCollection = collection(db, `schools/${schoolDoc.id}/users`);
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        schoolData.users = usersData;
        schoolsData.push(schoolData);
      }

      setState((prevState) => ({ ...prevState, schools: schoolsData }));
    } catch (error) {
      // removed console output
    }
  }, [db]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const updateSelectedSchool = async (schoolName, schoolId) => {
    try {
      const schoolDocRef = doc(db, "schools", schoolId);
      const schoolDoc = await getDoc(schoolDocRef);

      if (schoolDoc.exists()) {
        const schoolData = schoolDoc.data();
        const schoolAddress = schoolData.address || "";
        const schoolPhone = schoolData.phoneNumber || "";
        const schoolEmail = schoolData.email || "";

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
      // removed console output
    }
  };

  // Persist selected school details in localStorage
  useEffect(() => {
    if (state.selectedSchoolName) {
      localStorage.setItem("selectedSchoolName", state.selectedSchoolName);
    }
    if (state.selectedSchoolId) {
      localStorage.setItem("selectedSchoolId", state.selectedSchoolId);
    }
    if (state.selectedSchoolAddress) {
      localStorage.setItem("selectedSchoolAddress", state.selectedSchoolAddress);
    }
    if (state.selectedSchoolPhoneNumber) {
      localStorage.setItem(
        "selectedSchoolPhoneNumber",
        state.selectedSchoolPhoneNumber
      );
    }
    if (state.selectedSchoolEmail) {
      localStorage.setItem("selectedSchoolEmail", state.selectedSchoolEmail);
    }
  }, [
    state.selectedSchoolName,
    state.selectedSchoolId,
    state.selectedSchoolAddress,
    state.selectedSchoolPhoneNumber,
    state.selectedSchoolEmail,
  ]);

  // Retrieve saved school details from localStorage on page load
  useEffect(() => {
    const savedSchoolName = localStorage.getItem("selectedSchoolName");
    const savedSchoolId = localStorage.getItem("selectedSchoolId");
    const savedSchoolAddress = localStorage.getItem("selectedSchoolAddress");
    const savedSchoolPhoneNumber = localStorage.getItem(
      "selectedSchoolPhoneNumber"
    );
    const savedSchoolEmail = localStorage.getItem("selectedSchoolEmail");

    if (savedSchoolName && savedSchoolId) {
      setState((prevState) => ({
        ...prevState,
        selectedSchoolName: savedSchoolName,
        selectedSchoolId: savedSchoolId,
        selectedSchoolAddress: savedSchoolAddress || "",
        selectedSchoolPhoneNumber: savedSchoolPhoneNumber || "",
        selectedSchoolEmail: savedSchoolEmail || "",
      }));
    }
  }, []);

  // Helper: fetch students once (kept for compatibility)
  const fetchStudents = useCallback(async () => {
    try {
      if (!state.selectedSchoolId) {
        return;
      }

      const studentsCollectionRef = collection(
        db,
        `schools/${state.selectedSchoolId}/students`
      );
      const studentsSnapshot = await getDocs(studentsCollectionRef);

      if (!studentsSnapshot.empty) {
        const studentsData = studentsSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setState((prevState) => ({ ...prevState, students: studentsData }));
      }
    } catch (error) {
      // removed console output
    }
  }, [db, state.selectedSchoolId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // ✅ fetchFeesPaidData wrapped in useCallback and used as dep
  const fetchFeesPaidData = useCallback(
    async (schoolId) => {
      if (!schoolId) return [];
      const feesPaidCollection = collection(db, `schools/${schoolId}/payments`);
      const feesPaidSnapshot = await getDocs(feesPaidCollection);
      return feesPaidSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    [db]
  );

  useEffect(() => {
    const fetchFees = async () => {
      if (!state.selectedSchoolId) return;
      try {
        const feesData = await fetchFeesPaidData(state.selectedSchoolId);
        setState((prev) => ({ ...prev, feesPaid: feesData }));
      } catch (err) {
        // removed console output
      }
    };

    fetchFees();
  }, [fetchFeesPaidData, state.selectedSchoolId]);

  const calculateTotalFeesPaid = useCallback((payments) => {
    const list = Array.isArray(payments) ? payments : [];
    const total = list.reduce((totalAcc, payment) => {
      if (Array.isArray(payment?.items)) {
        const itemsSum = payment.items.reduce((sum, item) => {
          const feeValue = parseFloat(item?.amount ?? 0);
          return isNaN(feeValue) ? sum : sum + feeValue;
        }, 0);
        return totalAcc + itemsSum;
      }

      const v = parseFloat(
        payment?.amount ?? payment?.paidAmount ?? payment?.totalAmount ?? 0
      );
      return isNaN(v) ? totalAcc : totalAcc + v;
    }, 0);

    return Number(total.toFixed(2));
  }, []);

  // CART helpers (simple local state updates)
  const addToCart = (studentId) => {
    const studentToAdd = state.students.find((s) => s.id === studentId);
    if (!studentToAdd) return;

    const customFee = prompt(
      `Enter the fee amount for ${studentToAdd.name}:`,
      studentToAdd.fee || 0
    );
    const feeAmount =
      customFee && !isNaN(parseFloat(customFee))
        ? parseFloat(customFee)
        : studentToAdd.fee || 0;

    const existingCartItem = (state.cart || []).find(
      (item) => item.id === studentId
    );
    if (existingCartItem) {
      const updatedCart = (state.cart || []).map((item) =>
        item.id === studentId ? { ...item, fee: feeAmount } : item
      );
      setState((prev) => ({ ...prev, cart: updatedCart }));
    } else {
      const updatedCart = [
        ...(state.cart || []),
        { ...studentToAdd, fee: feeAmount },
      ];
      setState((prev) => ({ ...prev, cart: updatedCart }));
    }
  };

  const removeFromCart = (productId) => {
    const updatedCart = (state.cart || []).filter(
      (item) => item.id !== productId
    );
    setState((prev) => ({ ...prev, cart: updatedCart }));
  };

  const clearCart = () => setState((prev) => ({ ...prev, cart: [] }));

  const increaseQuantity = (productId) => {
    const updatedCart = (state.cart || []).map((item) =>
      item.id === productId
        ? { ...item, quantity: (item.quantity || 0) + 1 }
        : item
    );
    setState((prev) => ({ ...prev, cart: updatedCart }));
  };

  const decreaseQuantity = (productId) => {
    const existingCartItem = (state.cart || []).find(
      (item) => item.id === productId
    );
    if (existingCartItem && existingCartItem.quantity > 1) {
      const updatedCart = (state.cart || []).map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
      setState((prev) => ({ ...prev, cart: updatedCart }));
    } else {
      removeFromCart(productId);
    }
  };

  // Logout
  const logout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        setState((prev) => ({ ...prev, user: null }));
      })
      .catch(() => {
        // removed console output
      });
  };

  // Persist/load user to/from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setState((prev) => ({ ...prev, user: parsedUser }));
    }
  }, []);

  useEffect(() => {
    if (state.user) localStorage.setItem("user", JSON.stringify(state.user));
    else localStorage.removeItem("user");
  }, [state.user]);

  // ✅ include state.selectedSchoolId safely as dependency (no loop)
  useEffect(() => {
    const savedSchoolId = localStorage.getItem("selectedSchoolId");
    if (savedSchoolId && !state.selectedSchoolId) {
      setState((prev) => ({ ...prev, selectedSchoolId: savedSchoolId }));
    }
  }, [state.selectedSchoolId]);

  // Expose context value
  return (
    <MyContext.Provider
      value={{
        state,
        setState,
        updateSelectedSchool,
        searchByKeyword,
        refreshData,
        addToCart,
        calculateTotalFeesPaid,

        // ✅ P&L helpers/totals
        searchByDate,
        calculateTotalRevenue,
        calculateTotalExpenses,
        calculateTotalTaxes,

        removeFromCart,
        clearCart,
        toggleCart,
        toggleSidePanel,
        increaseQuantity,
        decreaseQuantity,
        logout,
      }}
    >
      {children}
    </MyContext.Provider>
  );
};
