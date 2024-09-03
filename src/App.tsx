import React from 'react';
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import { Autocomplete, Box, Card, Divider, IconButton, Select, Sheet, Option, Typography } from '@mui/joy';
import DeleteIcon from '@mui/icons-material/Delete';
import { Rating } from '@mui/material';

function App() {
  const [sessionState, setSessionState] = React.useState('unknown')
  const location = useLocation();
  const [token, setToken] = React.useState(localStorage.getItem("access_token"))
  const [groups, setGroups] = React.useState([])
  const [skills, setSkills] = React.useState([])
  const [members, setMembers] = React.useState<any>([])

  React.useEffect(() => {
    if(location.pathname.includes('access_token')) {
      location.pathname.split("&").map(param => {
        if(param.split("=")[0].includes("access_token")) {
          setToken(param.split("=")[1])
          localStorage.setItem("access_token", param.split("=")[1])
          window.location.href = "http://localhost:3000"
        }
      })
      
      return
    }
    if(!token) {
      window.location.href = 'https://login.mypurecloud.de/oauth/authorize?response_type=token&client_id=d7fcb9e0-08c6-458e-9559-481ba326c996&redirect_uri=http%3A%2F%2Flocalhost%3A3000/';
    }
  }, [])


  React.useEffect(() => {
    axios.get(`https://api.mypurecloud.de/api/v2/groups`, { headers: {"Authorization" : `Bearer ${token}`} })
    .then(result => {
      console.log(result)
      setGroups(result.data.entities)
    })
    .catch(error => {
      console.error(error);
    });

    axios.get(`https://api.mypurecloud.de/api/v2/routing/skills`, { headers: {"Authorization" : `Bearer ${token}`} })
    .then(result => {
      console.log(result)
      setSkills(result.data.entities)
    })
    .catch(error => {
      console.error(error);
    });
  
  }, [])

  const getGroupMembers = (groupId : string) => {
    console.log('get members')
    axios.get(`https://api.mypurecloud.de/api/v2/groups/${groupId}/members?expand=skills`, { headers: {"Authorization" : `Bearer ${token}`} })
    .then(result => {
      console.log(result)
      setMembers(result.data.entities)
    })
    .catch(error => {
      console.error(error);
    });
  }


  return (
    <div className="App">
      <Sheet sx={{
          borderRadius: 'sm',
          p: 2,
          listStyle: 'none',
        }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
        <Autocomplete
        placeholder="Groupes"
        size='sm'
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option: any, value: any) => option.id == value.id}
        onChange={(_, selected: any) => selected ?  getGroupMembers(selected.id) : setMembers([])}
        options={groups}
        sx={{ width: 300 }}
      /></Box>
      <Divider sx={{my: 1, mx: -2}}/>
      <Box sx={{ display: 'flex', gap: 1  , p:1, flexDirection: 'column' }}>
        {members.map((member: any) => <Card sx={{p:1}}><Box sx={{ display: 'flex', gap: 2,  }} justifyContent="space-between" alignItems='center'>
          <Typography level='title-sm'>{member.name}</Typography>
          <Autocomplete
            placeholder="Ajouter une compétence"
            size='sm'
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option: any, value: any) => option.id == value.id}
            onChange={(e, selected: any) => {
              e.preventDefault()
              selected && setMembers([...members.filter((skll: any) => skll.id != selected.id).map((mbr: any) => {
              if(mbr.id == member.id) {
                return {...mbr, skills: [...mbr.skills, selected]}
              }
              return mbr
            })])}}
            options={skills}
            sx={{ width: 300 }}
          />
          <Box />
       </Box>
       <Divider/>
       {member.skills.sort((a: any,b: any) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)).map((skill: any) => 
       <Box sx={{ display: 'flex', gap: 2,  }} justifyContent="space-between" alignItems='center'>
        <Typography sx={{width: 600}}>{skill.name}</Typography>
        <Rating
          size='small'
          name="simple-controlled"
          onChange={(_, value) => {
            setMembers([...members.map((mbr: any) => {
              if(mbr.id == member.id) {
                return {...mbr, skills: [...mbr.skills.filter((skll: any) => skll.id != skill.id), {...skill, proficiency: value}]}
              }
              return mbr
            })])
          }}
          value={skill.proficiency}
          />
        <IconButton aria-label="delete" color='danger' variant='plain' size='sm' onClick={() => {
          setMembers([...members.map((mbr: any) => {
            if(mbr.id == member.id) {
              return {...mbr, skills: [...mbr.skills.filter((skll: any) => skll.id != skill.id)]}
            }
            return mbr
          })])
        }}>
          <DeleteIcon />
        </IconButton>
        </Box>)}
        </Card>)}
      </Box>
      </Sheet>
      
    </div>
  );
}

export default App;
