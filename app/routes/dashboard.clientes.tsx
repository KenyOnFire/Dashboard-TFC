import { LoaderFunctionArgs, MetaFunction, json } from "@remix-run/node";
import TableResponsive from "./components/TableResponsive";
import AreaChart from "./components/charts/areachart";
import ColumnChart from "./components/charts/columnchart";
import PieChart from "./components/charts/piechart";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { useState } from "react";
import db from "~/services/db";
import TablaTest from "./components/TablaTest";
import { authenticator } from "~/services/auth.server";

export const meta: MetaFunction = () => {
    return [
        { title: 'Clientes' },
        { name: 'description', content: 'This is the login page' }
    ]
}
interface DataItem {
    [key: string]: any;
}
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await authenticator.isAuthenticated(request, {
        failureRedirect: "/login",
    });

    const cliente = await db.cliente.findMany({
        where: {
            usuarioId: user.id,
        },
    })
    const entrada = await db.entrada.findMany({
        where: {
            usuarioId: user.id,
        },
        orderBy: {
            evento: {
                fecha: "asc",
            },
        },
        include: {
            ordenDeEntrada: true,
        },
        cacheStrategy: { ttl: 60 },
    });
    const eventos = await db.evento.findMany({
        where: {
            usuarioId: user.id,
        },
        include: {
            entradas: {
                orderBy: {
                    id: 'asc',
                },
            },
        },
        orderBy: {
            id: 'asc',
        },
    });

    const ordenDeEntrada = await db.ordenDeEntrada.findMany({
        where: {},
    });
    const data = { cliente, eventos, ordenDeEntrada, entrada }
    return json({data});

}

export default function Clientes() {
    const fetchedData = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const [data, setData] = useState<DataItem[]>([fetchedData]); // State to hold fetched data

    const updateData = (newData: DataItem) => {
        setData(Array.from(newData as DataItem[]));
        const formData = new FormData();
        // console.log(newData[newData.length - 1])
        for (const key in newData[newData.length - 1]) {
            // Update the last key and value in each iteration
            // console.log(newData[newData.length - 1][key])
            formData.append(key, newData[newData.length - 1][key]);
        }
        // Populate FormData with key and value from newData
        submit(formData, { method: "post" }); // Submit FormData
        // console.log(newData); // Log updated data
    };
    // console.log("Datos clientes", data)
    return (
        <div className="flex flex-col h-fit sm:h-screen w-auto p-4">
            {/* Top row */}
            <div className="flex justify-center bg-[#222E3A]/[4%] rounded-lg">
                <div className="flex flex-col items-center sm:items-start sm:h-fit sm:flex-row overflow-hidden sm:overflow-auto mb-2">
                    <div className="w-auto sm:w-full">
                        {/* <div className="m-2 w-[300px]"><PieChart data={data} setData={updateData} /></div> */}
                    </div>
                    <div className="w-auto sm:w-full">
                        {/* <div className="m-2 w-[320px]"><AreaChart data={data} setData={updateData} /></div> */}
                    </div>
                    <div className="w-auto sm:w-full">
                        <div className="m-2 w-[300px]"><PieChart data={data} setData={updateData}/></div>
                    </div>
                </div>
            </div>


            {/* Bottom row */}
            <div className="flex flex-wrap flex-1">
                <div className="w-full h-fit"><TablaTest data={data[0].data.cliente} setData={updateData} /></div>
            </div>
        </div>

    )
}