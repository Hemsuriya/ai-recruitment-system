import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage"
import TemplateList from "../hr/Templates/TemplateList"
import HrLayout from "./components/layouts/HrLayout"

function App() {
  return (
   <BrowserRouter>
   <Routes>
    {/* Login */}
    <Route path="/login" element={<LoginPage/>}/>

    {/* HR Layouts routes */}
     <Route path="/hr" element={<HrLayout />}></Route>
     <Route path="/hr/templates" element={<TemplateList/>}/>
   </Routes>
   </BrowserRouter>
  );
}

export default App;
