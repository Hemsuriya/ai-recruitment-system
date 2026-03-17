import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage"
import TemplateList from "../hr/Templates/TemplateList"

function App() {
  return (
   <BrowserRouter>
   <Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/hr/templates" element={<TemplateList/>}/>
   </Routes>
   </BrowserRouter>
  );
}

export default App;
