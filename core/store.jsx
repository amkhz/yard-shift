import { createContext, useContext, useReducer } from 'react';

const initialState = {
  user: null,
  sales: [],
  currentSale: null,
  items: [],
  categories: [],
  loading: false,
  error: null,
  view: 'sales', // 'sales' | 'sale-detail' | 'add-item'
};

const actions = {
  SET_USER: 'SET_USER',
  SET_SALES: 'SET_SALES',
  ADD_SALE: 'ADD_SALE',
  SET_CURRENT_SALE: 'SET_CURRENT_SALE',
  SET_ITEMS: 'SET_ITEMS',
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_VIEW: 'SET_VIEW',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

function appReducer(state, action) {
  switch (action.type) {
    case actions.SET_USER:
      return { ...state, user: action.payload };
    case actions.SET_SALES:
      return { ...state, sales: action.payload };
    case actions.ADD_SALE:
      return { ...state, sales: [action.payload, ...state.sales] };
    case actions.SET_CURRENT_SALE:
      return { ...state, currentSale: action.payload };
    case actions.SET_ITEMS:
      return { ...state, items: action.payload };
    case actions.ADD_ITEM:
      return { ...state, items: [action.payload, ...state.items] };
    case actions.UPDATE_ITEM:
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
    case actions.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
    case actions.SET_CATEGORIES:
      return { ...state, categories: action.payload };
    case actions.SET_LOADING:
      return { ...state, loading: action.payload };
    case actions.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case actions.SET_VIEW:
      return { ...state, view: action.payload };
    case actions.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
}

const AppContext = createContext(null);
const AppDispatchContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (context === null) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
}

export { actions };
