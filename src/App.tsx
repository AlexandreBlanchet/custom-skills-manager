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
  const [queues, setQueues] = React.useState([])
  const [skills, setSkills] = React.useState([])
  const [members, setMembers] = React.useState<any>([])

  React.useEffect(() => {
    if(location.pathname.includes('access_token')) {
      location.pathname.split("&").map(param => {
        if(param.split("=")[0].includes("access_token")) {
          setToken(param.split("=")[1])
          localStorage.setItem("access_token", param.split("=")[1])
          window.location.href = "https://alexandreblanchet.github.io/custom-skills-manager"
          //window.location.href = "http://localhost:3000"
        }
      })
      
      return
    }
    if(!token) {
      window.location.href = 'https://login.mypurecloud.de/oauth/authorize?response_type=token&client_id=d7fcb9e0-08c6-458e-9559-481ba326c996&redirect_uri=https%3A%2F%2Falexandreblanchet.github.io%2Fcustom-skills-manager%2F';
     // window.location.href = 'https://login.mypurecloud.de/oauth/authorize?response_type=token&client_id=d7fcb9e0-08c6-458e-9559-481ba326c996&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F';
    }
  }, [])


  React.useEffect(() => {
    if(!token) {
      return
    }
    axios.get(`https://api.mypurecloud.de/api/v2/groups`, { headers: {"Authorization" : `Bearer ${token}`} })
    .then(result => {
      setGroups(result.data.entities)
    })
    .catch(error => {
      console.error(error);
      localStorage.setItem("access_token",'')
    });

    axios.get(`https://api.mypurecloud.de/api/v2/routing/skills`, { headers: {"Authorization" : `Bearer ${token}`} })
    .then(result => {
      setSkills(result.data.entities)
    })
    .catch(error => {
      console.error(error);
      localStorage.setItem("access_token",'')
    });

    axios.get(`https://api.mypurecloud.de/api/v2/routing/queues`, { headers: {"Authorization" : `Bearer ${token}`} })
    .then(result => {
      setQueues(result.data.entities)
      localStorage.setItem("access_token",'')
    })
    .catch(error => {
      console.error(error);
    });
  
  }, [])

  const getGroupMembers = (groupId : string) => {
    axios.get(`https://api.mypurecloud.de/api/v2/groups/${groupId}/members?expand=skills`, { headers: {"Authorization" : `Bearer ${token}`} })
    .then(result => {
      setMembers(result.data.entities)
    })
    .catch(error => {
      console.error(error);
    });
  }

  const getQueueMembers = (queueId : string) => {
    axios.get(`https://api.mypurecloud.de/api/v2/routing/queues/${queueId}/members?expand=skills`, { headers: {"Authorization" : `Bearer ${token}`} })
    .then(result => {
      setMembers([...result.data.entities.map((result: any) => result.user)])
    })
    .catch(error => {
      console.error(error);
    });
  }

  
  const updateGroupMember = (userId : string, skills: any) => {
    axios.put(`https://api.mypurecloud.de/api/v2/users/${userId}/routingskills/bulk`, skills,
      { headers: {"Authorization" : `Bearer ${token}`} })
    .then(result => {
      console.log(result)
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
      /><Autocomplete
      placeholder="Queues"
      size='sm'
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option: any, value: any) => option.id == value.id}
      onChange={(_, selected: any) => selected ?  getQueueMembers(selected.id) : setMembers([])}
      options={queues}
      sx={{ width: 300 }}
    /></Box>
      <Divider sx={{my: 1, mx: -2}}/>
      <Box sx={{ display: 'flex', gap: 1  , p:1, flexDirection: 'column' }}>
        {members.map((member: any) => <Card key={member.id}  sx={{p:1}}><Box sx={{ display: 'flex', gap: 2,  }} justifyContent="space-between" alignItems='center'>
          <Typography level='title-sm'>{member.name}</Typography>
          <Autocomplete
            placeholder="Ajouter une compétence"
            size='sm'
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option: any, value: any) => option.id == value.id}
            onChange={(e, selected: any) => {
              
              selected && setMembers([...members.filter((skll: any) => skll.id != selected.id).map((mbr: any) => {
              if(mbr.skills && mbr.id == member.id) {
                updateGroupMember(member.id, [...mbr.skills, {...selected, proficiency: 0}])
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
       {member.skills && member.skills.sort((a: any,b: any) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)).map((skill: any) => 
       <Box key={skill.id} sx={{ display: 'flex', gap: 2,  }} justifyContent="space-between" alignItems='center'>
        <Typography sx={{width: 500}} level='body-sm'>{skill.name}</Typography>
        <Rating
          size='small'
          name="simple-controlled"
          onChange={(_, value) => {
            setMembers([...members.map((mbr: any) => {
              if(mbr.id == member.id) {
                updateGroupMember(member.id, [...mbr.skills.filter((skll: any) => skll.id != skill.id), {...skill, proficiency: value}])
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
              updateGroupMember(member.id, [...mbr.skills.filter((skll: any) => skll.id != skill.id)])
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
