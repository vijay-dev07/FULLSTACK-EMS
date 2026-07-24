import Employee from "../models/Employee.js";
import bcrypt from "bcrypt";
import User from "../models/User.js";

// Get employees 
// Get /api/employess


export const  getEmployess = async (req , res ) => {
    try {

        const {departement} = async (req , res) =>{
            const where = {};
            if(departement)where.departement = departement;
            const employees = (await Employee.find(where)).toSorted({createdAt:-1}).populate("userId" , "email role").lean();

            const result = employees.map((emp)=> ({
                ...emp,
                id:emp._d.toString(),
                user:emp.userId ? {email: emp.userId.email, role:emp.userId.role} : null
            }))

            return res.json(result);
        }
        
    } catch (error) {
        return res.status(500).json({error: "failed to fetch employees" });
    }

}

// Create employess
// Post /api/employess

export const createEmployee = async (req, res)=> {

    try {

        const {firstName , lastName , email , phone, position , departement , basicSalary, allowances, 
               deductions , joinDate, password , role , bio  } = req.body;

        if(!email || !password || !firstName || !lastName){
            return res.status(400).json({error:"Missing Required Fields"});
        }

        const hashed = await bcrypt.hash(password , 10);
        const  user = await User.create({
            email, 
            password:hashed,
            role:role || "EMPLOYEE"
        })

        const employee = await Employee.create({
            userId:user._id,
            firstName,
            lastName,
            email,
            phone,
            position,
            departement: departement || "Engineering",
            basicSalary:Number(basicSalary) || 0,
            allowances:Number(allowances) || 0,
            deductions:Number(deductions) || 0,
            joinDate:new Date(joinDate),
            bio:bio || "",
        })

        return res.status(201).json({success:true, employee})
        
    } catch (error) {

        if(error.code === 11000){
            return res.status(400).json({error: "Email already exists"})
        }

        console.error("Create employee error:" , error)
        return res.status(500).json({
            error: "failed to create employee"
        });
    }

}

// Update employee
// PUT /api/employee/:id

export const updateEmployee = async (req, res)=> {

     try {

        const {id} = req.params;

        const {firstName , lastName , email , phone, position , departement , basicSalary, allowances, 
               deductions , password , role , bio ,employmentStatus } = req.body;

        const employee = await Employee.findById(id);
        if(!employee) return res.status(404).json({error:"Employee not found"})

        await Employee.findByIdAndUpdate(id,{
            firstName,
            lastName,
            email,
            phone,
            position,
            departement: departement || "Engineering",
            basicSalary:Number(basicSalary) || 0,
            allowances:Number(allowances) || 0,
            deductions:Number(deductions) || 0,
            employmentStatus:employmentStatus || "ACTIVE",
            bio:bio || "",
        })

        // update user record
        const userUpdate = {email}
        if(role) userUpdate.role = role;
        if(password) userUpdate.password = await bcrypt.hash(password , 10);
        await User.findByIdAndUpdate(employee.userId, userUpdate )

        return res.json({success:true})
        
    } catch (error) {

        if(error.code === 11000){
            return res.status(400).json({error: "Email already exists"})
        }

        return res.status(500).json({
            error: "failed to Update employee"
        });
    }


}

// Delete employee
// PUT /api/employee/:id

export const deleteEmployee = async (req, res)=> {

    try {

        const {id} = req.params;

        const employee = await Employee.findById(id)
        if(!employee) return res.status(404).json({
            error: "Employee not found"
        });

        employee.isDeleted = true;
        employee.employmentStatus = "INACTIVE";

        await employee.save()

        return res.json({success: true});
        
    } catch (error) {

        return res.status(500).json({error: "Failed to delete employee"});
        
    }

}